// Write — modeled on Claude Code's FileWriteTool.

import { Inject, Injectable } from '@nestjs/common';
import { mkdir, stat, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { PROMPT, WRITE_TOOL_NAME } from './prompt';

const inputSchema = z.strictObject({
  file_path: z.string().describe(
    'The absolute path to the file to write (must be absolute, not relative)',
  ),
  content: z.string().describe('The content to write to the file'),
});

@Injectable()
export class WriteTool implements Tool<typeof inputSchema> {
  readonly name = WRITE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    let abs: string;
    try {
      abs = resolveSafePath(this.config.workspaceRoot, input.file_path);
    } catch (e) {
      return err((e as Error).message);
    }
    let existed = false;
    try {
      const s = await stat(abs);
      if (s.isDirectory()) return err(`Path is a directory, not a file: ${input.file_path}`);
      existed = true;
    } catch {
      existed = false;
    }
    try {
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, input.content, 'utf8');
      const verb = existed ? 'updated' : 'created';
      return ok(`File ${verb}: ${input.file_path} (${Buffer.byteLength(input.content, 'utf8')} bytes)`);
    } catch (e) {
      return err(`Failed to write ${input.file_path}: ${(e as Error).message}`);
    }
  }
}
