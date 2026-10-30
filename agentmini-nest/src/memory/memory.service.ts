// Memory CRUD against a per-project directory. The default location is:
//   <workspaceRoot>/.agentmini/memory/
// Override with AGENTMINI_MEMORY_DIR. The MEMORY.md file at the root of the
// directory is auto-maintained: it is the index that gets loaded into the
// system context at session start (≤200 lines, otherwise truncated).

import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import type { MemoryRecord, MemoryType, MemoryListEntry } from './memory.types';

const INDEX_FILE = 'MEMORY.md';
const INDEX_LINE_CAP = 200;

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  private dir(): string {
    return process.env.AGENTMINI_MEMORY_DIR
      ?? path.join(this.config.workspaceRoot, '.agentmini', 'memory');
  }

  async list(): Promise<MemoryListEntry[]> {
    const entries = await this.readAll();
    return entries.map(({ name, description, type }) => ({ name, description, type }));
  }

  async read(name: string): Promise<MemoryRecord | null> {
    const file = path.join(this.dir(), `${name}.md`);
    try {
      const raw = await fs.readFile(file, 'utf8');
      const stat = await fs.stat(file);
      return parseRecord(name, raw, file, stat.mtime.toISOString());
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  async write(input: {
    name: string;
    description: string;
    type: MemoryType;
    content: string;
  }): Promise<MemoryRecord> {
    await fs.mkdir(this.dir(), { recursive: true });
    const file = path.join(this.dir(), `${input.name}.md`);
    const safeName = input.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (safeName !== input.name) {
      throw new Error(`Invalid memory name "${input.name}". Use [a-zA-Z0-9_-] only.`);
    }
    const body = renderRecord(input);
    await fs.writeFile(file, body, 'utf8');
    await this.rebuildIndex();
    const stat = await fs.stat(file);
    return {
      name: input.name,
      description: input.description,
      type: input.type,
      content: input.content,
      updatedAt: stat.mtime.toISOString(),
      path: file,
    };
  }

  async delete(name: string): Promise<boolean> {
    const file = path.join(this.dir(), `${name}.md`);
    try {
      await fs.unlink(file);
      await this.rebuildIndex();
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw e;
    }
  }

  // Returns the MEMORY.md index — what to inject into the system context on
  // session start so the agent sees its memories without reading every file.
  async readIndex(): Promise<string> {
    const file = path.join(this.dir(), INDEX_FILE);
    try { return await fs.readFile(file, 'utf8'); }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return '';
      throw e;
    }
  }

  private async rebuildIndex(): Promise<void> {
    const records = await this.readAll();
    const lines = records
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => `- [${r.name}](${r.name}.md) — ${r.description}`)
      .slice(0, INDEX_LINE_CAP);
    const file = path.join(this.dir(), INDEX_FILE);
    await fs.writeFile(file, lines.join('\n') + '\n', 'utf8');
  }

  private async readAll(): Promise<MemoryRecord[]> {
    let entries: string[];
    try { entries = await fs.readdir(this.dir()); }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
    const out: MemoryRecord[] = [];
    for (const f of entries) {
      if (!f.endsWith('.md') || f === INDEX_FILE) continue;
      const file = path.join(this.dir(), f);
      try {
        const raw = await fs.readFile(file, 'utf8');
        const stat = await fs.stat(file);
        const rec = parseRecord(f.slice(0, -3), raw, file, stat.mtime.toISOString());
        if (rec) out.push(rec);
      } catch (e) {
        this.logger.warn(`Failed to read memory ${file}: ${(e as Error).message}`);
      }
    }
    return out;
  }
}

function parseRecord(name: string, raw: string, file: string, updatedAt: string): MemoryRecord | null {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { name, description: '', type: 'project', content: raw, updatedAt, path: file };
  }
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return null;
  const header = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const fm: { name?: string; description?: string; type?: MemoryType } = {};
  for (const line of header.split(/\r?\n/)) {
    const m = /^([a-zA-Z_][\w-]*)\s*:\s*(.+)$/.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.replace(/^["']|["']$/g, '').trim();
    if (key === 'name') fm.name = value;
    if (key === 'description') fm.description = value;
    if (key === 'type' && ['user', 'feedback', 'project', 'reference'].includes(value)) {
      fm.type = value as MemoryType;
    }
  }
  return {
    name: fm.name ?? name,
    description: fm.description ?? '',
    type: fm.type ?? 'project',
    content: body,
    updatedAt,
    path: file,
  };
}

function renderRecord(input: { name: string; description: string; type: MemoryType; content: string }): string {
  return `---\nname: ${input.name}\ndescription: ${input.description}\ntype: ${input.type}\n---\n\n${input.content.trim()}\n`;
}
