// Glob — fast file-pattern matching, modeled on Claude Code's GlobTool.
// Sorts results by mtime descending and truncates at 100.

import { Inject, Injectable } from '@nestjs/common';
import fg from 'fast-glob';
import { stat } from 'fs/promises';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath, toRelative } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { GLOB_TOOL_NAME, PROMPT } from './prompt';

const RESULT_LIMIT = 100;

const inputSchema = z.strictObject({
  pattern: z.string().describe('The glob pattern to match files against'),
  path: z
    .string()
    .optional()
    .describe(
      'The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.',
    ),
});

@Injectable()
export class GlobTool implements Tool<typeof inputSchema> {
  readonly name = GLOB_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    let cwd: string;
    try {
      cwd = input.path ? resolveSafePath(this.config.workspaceRoot, input.path) : this.config.workspaceRoot;
    } catch (e) {
      return err((e as Error).message);
    }
    let matches: string[] = [];
    try {
      matches = await fg(input.pattern, {
        cwd,
        absolute: true,
        dot: false,
        onlyFiles: true,
        followSymbolicLinks: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });
    } catch (e) {
      return err(`Glob failed: ${(e as Error).message}`);
    }
    if (matches.length === 0) return ok('No files found');

    const withMtime = await Promise.all(
      matches.map(async (abs) => {
        try {
          const s = await stat(abs);
          return { abs, mtime: s.mtimeMs };
        } catch {
          return { abs, mtime: 0 };
        }
      }),
    );
    withMtime.sort((a, b) => b.mtime - a.mtime);

    const truncated = withMtime.length > RESULT_LIMIT;
    const display = withMtime.slice(0, RESULT_LIMIT).map((m) => toRelative(this.config.workspaceRoot, m.abs));
    const lines = [
      ...display,
      ...(truncated ? ['(Results are truncated. Consider using a more specific path or pattern.)'] : []),
    ];
    return ok(lines.join('\n'));
  }
}
