// LS — list directory entries. Modeled on Claude Code's LS tool.

import { Inject, Injectable } from '@nestjs/common';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { LS_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  path: z.string().describe('The absolute path to the directory to list (must be absolute, not relative)'),
  ignore: z.array(z.string()).optional().describe('List of glob patterns to ignore'),
});

@Injectable()
export class LSTool implements Tool<typeof inputSchema> {
  readonly name = LS_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    let abs: string;
    try {
      abs = resolveSafePath(this.config.workspaceRoot, input.path);
    } catch (e) {
      return err((e as Error).message);
    }
    try {
      const s = await stat(abs);
      if (!s.isDirectory()) return err(`Path is not a directory: ${input.path}`);
    } catch {
      return err(`Directory does not exist: ${input.path}`);
    }
    let entries;
    try {
      entries = await readdir(abs, { withFileTypes: true });
    } catch (e) {
      return err(`Failed to list ${input.path}: ${(e as Error).message}`);
    }

    // Glob-pattern ignore filter — simple but matches Claude Code's UX.
    // Strips wildcards from each pattern so substring match approximates the intent.
    const ignored = (input.ignore ?? []).map((g) => g.replace(/\*\*?/g, ''));
    const filtered = entries.filter((e) => !ignored.some((ig) => ig && e.name.includes(ig)));
    if (filtered.length === 0) return ok('(empty directory)');

    // Dirs first (alphabetical), then files (alphabetical) — matches Claude Code's tree output
    const dirs = filtered.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const files = filtered.filter((e) => !e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const lines: string[] = [`- ${input.path}`];
    for (const d of dirs) lines.push(`  - ${d.name}/`);
    for (const f of files) {
      try {
        const s = await stat(join(abs, f.name));
        lines.push(`  - ${f.name} (${formatSize(s.size)})`);
      } catch {
        lines.push(`  - ${f.name}`);
      }
    }
    return ok(lines.join('\n'));
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)}M`;
  return `${(bytes / 1024 ** 3).toFixed(1)}G`;
}
