// Loads user-defined slash commands from markdown files at startup.
// Each .md file becomes one /<filename> command. The file body is the prompt
// template; "{{args}}" is replaced with the user-supplied arguments. The
// resulting text is injected into the conversation as a user message (NOT
// dispatched to the LLM directly — that keeps the model honest about who said
// what, and lets compaction/history persist the expanded prompt).
//
// Lookup directories (all scanned, both contribute commands):
//   1. <workspaceRoot>/.agentmini/commands/*.md   (project-scoped)
//   2. ~/.agentmini-nest/commands/*.md            (user-scoped)
// If both define the same name, project-scoped wins.
//
// Frontmatter (optional YAML-ish):
//   ---
//   description: Plan a feature end-to-end
//   aliases: [pf, feature-plan]
//   ---
// Frontmatter parsing is intentionally simple — only `description` and
// `aliases` are recognized.

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type {
  CommandContext,
  CommandResult,
  SlashCommand,
} from './command.interface';

interface CustomCommandFile {
  name: string;
  description: string;
  aliases: string[];
  body: string;
  source: string;
}

@Injectable()
export class CustomCommandLoader {
  private readonly logger = new Logger(CustomCommandLoader.name);

  async loadAll(workspaceRoot: string): Promise<SlashCommand[]> {
    const dirs = [
      path.join(workspaceRoot, '.agentmini', 'commands'),
      path.join(os.homedir(), '.agentmini-nest', 'commands'),
    ];
    const seen = new Map<string, CustomCommandFile>();
    for (const dir of dirs) {
      const files = await this.readDir(dir);
      for (const f of files) {
        // Project-scoped first; only overwrite if the same name comes from
        // user-scoped, never the other way around.
        if (!seen.has(f.name)) seen.set(f.name, f);
      }
    }
    const cmds = Array.from(seen.values()).map((f) => this.toCommand(f));
    if (cmds.length > 0) {
      this.logger.log(`Loaded ${cmds.length} custom slash command(s): ${cmds.map((c) => '/' + c.name).join(', ')}`);
    }
    return cmds;
  }

  private async readDir(dir: string): Promise<CustomCommandFile[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Failed to read ${dir}: ${(e as Error).message}`);
      }
      return [];
    }
    const out: CustomCommandFile[] = [];
    for (const f of entries) {
      if (!f.endsWith('.md')) continue;
      const filePath = path.join(dir, f);
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = parseFrontmatter(raw);
        const name = f.slice(0, -3); // strip .md
        out.push({
          name,
          description: parsed.frontmatter.description ?? `Custom command from ${filePath}`,
          aliases: parsed.frontmatter.aliases ?? [],
          body: parsed.body,
          source: filePath,
        });
      } catch (e) {
        this.logger.warn(`Failed to load ${filePath}: ${(e as Error).message}`);
      }
    }
    return out;
  }

  private toCommand(f: CustomCommandFile): SlashCommand {
    const body = f.body;
    return {
      name: f.name,
      description: f.description,
      aliases: f.aliases.length > 0 ? f.aliases : undefined,
      async call(args: string, ctx: CommandContext): Promise<CommandResult> {
        const expanded = body.replace(/\{\{\s*args\s*\}\}/g, args);
        // Inject the expanded prompt as a user message and let the engine run
        // it on the next turn. But because slash commands return synchronously,
        // we instead append a marker note and tell the controller to treat it
        // as text. The simplest mirror of Claude Code is: push the expanded
        // text as a user message and return a text echo.
        ctx.messages.push({ role: 'user', content: expanded });
        return {
          type: 'text',
          value: `[Expanded /${f.name} → injected ${expanded.length} chars from ${path.basename(f.source)}]`,
        };
      },
    };
  }
}

interface FrontmatterParsed {
  frontmatter: { description?: string; aliases?: string[] };
  body: string;
}

function parseFrontmatter(raw: string): FrontmatterParsed {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { frontmatter: {}, body: raw };
  }
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { frontmatter: {}, body: raw };
  const header = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const fm: { description?: string; aliases?: string[] } = {};
  for (const line of header.split(/\r?\n/)) {
    const m = /^([a-zA-Z_][\w-]*)\s*:\s*(.+)$/.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === 'description') fm.description = stripQuotes(value);
    if (key === 'aliases') {
      // Accept [a, b, c] or a,b,c
      const inner = value.replace(/^\[|\]$/g, '');
      fm.aliases = inner.split(',').map((s) => stripQuotes(s.trim())).filter(Boolean);
    }
  }
  return { frontmatter: fm, body };
}

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, '');
}
