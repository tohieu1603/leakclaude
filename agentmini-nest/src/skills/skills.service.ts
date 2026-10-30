// Loads markdown skills from .agentmini/skills/*.md and ~/.agentmini-nest/skills/*.md
// at boot. Skills are loaded lazily into the conversation via /skill <name>.
// Updating a skill file requires a reload (POST /api/skills/reload).

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import type { SkillFile } from './skills.types';

@Injectable()
export class SkillsService implements OnModuleInit {
  private readonly logger = new Logger(SkillsService.name);
  private skills = new Map<string, SkillFile>();

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    const dirs = [
      path.join(this.config.workspaceRoot, '.agentmini', 'skills'),
      path.join(os.homedir(), '.agentmini-nest', 'skills'),
    ];
    const next = new Map<string, SkillFile>();
    for (const dir of dirs) {
      const entries = await this.readDir(dir);
      for (const f of entries) {
        if (!next.has(f.name)) next.set(f.name, f);
      }
    }
    this.skills = next;
    if (next.size > 0) {
      this.logger.log(`Loaded ${next.size} skill(s): ${Array.from(next.keys()).join(', ')}`);
    }
  }

  list(): SkillFile[] {
    return Array.from(this.skills.values());
  }

  get(name: string): SkillFile | undefined {
    return this.skills.get(name);
  }

  private async readDir(dir: string): Promise<SkillFile[]> {
    let entries: string[];
    try { entries = await fs.readdir(dir); }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Failed to read ${dir}: ${(e as Error).message}`);
      }
      return [];
    }
    const out: SkillFile[] = [];
    for (const f of entries) {
      if (!f.endsWith('.md')) continue;
      const filePath = path.join(dir, f);
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = stripFrontmatter(raw);
        out.push({
          name: f.slice(0, -3),
          description: parsed.description ?? `Skill from ${filePath}`,
          body: parsed.body,
          source: filePath,
        });
      } catch (e) {
        this.logger.warn(`Failed to load skill ${filePath}: ${(e as Error).message}`);
      }
    }
    return out;
  }
}

function stripFrontmatter(raw: string): { description?: string; body: string } {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) return { body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { body: raw };
  const header = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  let description: string | undefined;
  for (const line of header.split(/\r?\n/)) {
    const m = /^description\s*:\s*(.+)$/i.exec(line);
    if (m) description = m[1]!.replace(/^["']|["']$/g, '').trim();
  }
  return { description, body };
}
