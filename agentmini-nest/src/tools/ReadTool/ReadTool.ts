// Read — modeled on Claude Code's FileReadTool. cat -n style numbered output.

import { Inject, Injectable } from '@nestjs/common';
import { readFile, stat } from 'fs/promises';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { MAX_FILE_BYTES, MAX_LINES_TO_READ, MAX_LINE_LEN, PROMPT, READ_TOOL_NAME } from './prompt';

// Devices that hang or stream forever — refused outright (matches Claude Code's BLOCKED_DEVICE_PATHS)
const BLOCKED_DEVICE_PATHS = new Set([
  '/dev/zero', '/dev/random', '/dev/urandom', '/dev/full',
  '/dev/stdin', '/dev/tty', '/dev/console',
  '/dev/stdout', '/dev/stderr',
  '/dev/fd/0', '/dev/fd/1', '/dev/fd/2',
]);

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to read'),
  offset: z.number().int().nonnegative().optional().describe(
    'The line number to start reading from. Only provide if the file is too large to read at once',
  ),
  limit: z.number().int().positive().optional().describe(
    'The number of lines to read. Only provide if the file is too large to read at once.',
  ),
});

@Injectable()
export class ReadTool implements Tool<typeof inputSchema> {
  readonly name = READ_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    let abs: string;
    try {
      abs = resolveSafePath(this.config.workspaceRoot, input.file_path);
    } catch (e) {
      return err((e as Error).message);
    }
    if (BLOCKED_DEVICE_PATHS.has(abs)) {
      return err(`Refusing to read device path: ${abs}`);
    }

    let size: number;
    try {
      const s = await stat(abs);
      if (s.isDirectory()) return err(`Path is a directory, not a file: ${input.file_path}. Use the LS tool.`);
      size = s.size;
    } catch {
      return err(`File does not exist: ${input.file_path}`);
    }
    if (size > MAX_FILE_BYTES) {
      return err(`File too large to read (${size} bytes). Maximum is ${MAX_FILE_BYTES} bytes.`);
    }

    let content: string;
    try {
      content = await readFile(abs, 'utf8');
    } catch (e) {
      return err(`Failed to read ${input.file_path}: ${(e as Error).message}`);
    }
    if (content.length === 0) {
      return ok('<system-reminder>This file exists but has empty contents.</system-reminder>');
    }

    const lines = content.split('\n');
    const startLine = input.offset ?? 1;
    const startIdx = Math.max(0, startLine - 1);
    const limit = Math.min(input.limit ?? MAX_LINES_TO_READ, MAX_LINES_TO_READ);
    const slice = lines.slice(startIdx, startIdx + limit);

    const numbered = slice.map((line, i) => {
      const lineNo = (startIdx + i + 1).toString().padStart(6, ' ');
      const safeLine = line.length > MAX_LINE_LEN
        ? line.slice(0, MAX_LINE_LEN) + ' …[truncated line]'
        : line;
      return `${lineNo}\t${safeLine}`;
    });

    const remaining = lines.length - (startIdx + slice.length);
    const footer = remaining > 0
      ? `\n\n... ${remaining} more line(s). Use offset=${startIdx + slice.length + 1} to continue.`
      : '';

    return ok(numbered.join('\n') + footer);
  }
}
