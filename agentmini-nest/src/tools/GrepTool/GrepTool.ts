// Grep — content search via ripgrep with grep fallback. Modeled on Claude Code's GrepTool.

import { Inject, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { GREP_TOOL_NAME, PROMPT } from './prompt';

const execAsync = promisify(exec);
const DEFAULT_HEAD_LIMIT = 200;

const inputSchema = z.strictObject({
  pattern: z.string().describe('The regular expression pattern to search for in file contents'),
  path: z
    .string()
    .optional()
    .describe('File or directory to search in (rg PATH). Defaults to current working directory.'),
  glob: z
    .string()
    .optional()
    .describe('Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob'),
  output_mode: z
    .enum(['content', 'files_with_matches', 'count'])
    .optional()
    .describe(
      'Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "files_with_matches".',
    ),
  '-A': z.number().int().min(0).max(100).optional().describe(
    'Number of lines to show after each match (rg -A). Requires output_mode: "content".',
  ),
  '-B': z.number().int().min(0).max(100).optional().describe(
    'Number of lines to show before each match (rg -B). Requires output_mode: "content".',
  ),
  '-C': z.number().int().min(0).max(100).optional().describe(
    'Number of lines before AND after each match (rg -C). Requires output_mode: "content".',
  ),
  '-i': z.boolean().optional().describe('Case-insensitive matching (rg -i)'),
  '-n': z.boolean().optional().describe('Show line numbers in output (rg -n). Requires output_mode: "content".'),
  type: z.string().optional().describe('File type to search (rg --type), e.g. "js", "py", "rust"'),
  head_limit: z.number().int().min(1).max(2000).optional().describe(
    `Limit output to first N lines/entries (default ${DEFAULT_HEAD_LIMIT}).`,
  ),
  multiline: z.boolean().optional().describe('Enable multiline mode where . matches newlines (rg --multiline --multiline-dotall).'),
});

@Injectable()
export class GrepTool implements Tool<typeof inputSchema> {
  readonly name = GREP_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  private readonly logger = new Logger(GrepTool.name);
  private rgAvailable: boolean | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    let target: string;
    try {
      target = input.path ? resolveSafePath(this.config.workspaceRoot, input.path) : this.config.workspaceRoot;
    } catch (e) {
      return err((e as Error).message);
    }

    const headLimit = input.head_limit ?? DEFAULT_HEAD_LIMIT;
    const mode = input.output_mode ?? 'files_with_matches';
    const useRg = await this.detectRipgrep();

    const cmd = useRg ? this.buildRg(input, target, mode) : this.buildGrep(input, target, mode);

    try {
      const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 4 });
      const lines = stdout.split('\n').filter((l) => l.length > 0);
      if (lines.length === 0) return ok('No matches found');
      const truncated = lines.length > headLimit;
      const display = lines.slice(0, headLimit).join('\n');
      return ok(
        truncated
          ? `${display}\n(truncated to head_limit=${headLimit}; ${lines.length - headLimit} more line(s))`
          : display,
      );
    } catch (e) {
      const ex = e as { code?: number; stdout?: string; message?: string };
      // grep / rg exit 1 when there are no matches
      if (ex.code === 1 && !ex.stdout) return ok('No matches found');
      return err(`Grep failed: ${ex.message ?? String(e)}`);
    }
  }

  private async detectRipgrep(): Promise<boolean> {
    if (this.rgAvailable !== null) return this.rgAvailable;
    try {
      await execAsync('which rg');
      this.rgAvailable = true;
    } catch {
      this.rgAvailable = false;
      this.logger.warn('ripgrep (rg) not on PATH — falling back to /usr/bin/grep');
    }
    return this.rgAvailable;
  }

  private buildRg(input: z.infer<typeof inputSchema>, target: string, mode: string): string {
    const flags: string[] = ['--color=never'];
    if (input['-i']) flags.push('--ignore-case');
    if (input.multiline) flags.push('--multiline', '--multiline-dotall');
    if (input.glob) flags.push(`--glob=${quote(input.glob)}`);
    if (input.type) flags.push(`--type=${quote(input.type)}`);
    if (mode === 'files_with_matches') {
      flags.push('--files-with-matches');
    } else if (mode === 'count') {
      flags.push('--count-matches', '--no-filename');
    } else {
      flags.push('--no-heading');
      if (input['-n']) flags.push('--line-number');
      if (input['-A'] !== undefined) flags.push(`-A${input['-A']}`);
      if (input['-B'] !== undefined) flags.push(`-B${input['-B']}`);
      if (input['-C'] !== undefined) flags.push(`-C${input['-C']}`);
    }
    return `rg ${flags.join(' ')} -- ${quote(input.pattern)} ${quote(target)}`;
  }

  private buildGrep(input: z.infer<typeof inputSchema>, target: string, mode: string): string {
    const flags: string[] = ['-RE', '--color=never'];
    if (input['-i']) flags.push('-i');
    if (mode === 'files_with_matches') flags.push('-l');
    else if (mode === 'count') flags.push('-c');
    else if (input['-n']) flags.push('-n');
    if (mode === 'content') {
      if (input['-A'] !== undefined) flags.push(`-A${input['-A']}`);
      if (input['-B'] !== undefined) flags.push(`-B${input['-B']}`);
      if (input['-C'] !== undefined) flags.push(`-C${input['-C']}`);
    }
    return `grep ${flags.join(' ')} -- ${quote(input.pattern)} ${quote(target)} 2>/dev/null`;
  }
}

function quote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
