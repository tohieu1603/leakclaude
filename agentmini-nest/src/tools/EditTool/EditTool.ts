// Edit — exact string replacement, modeled on Claude Code's FileEditTool.
// Supports file creation when old_string is empty.

import { Inject, Injectable } from '@nestjs/common';
import { readFile, stat, writeFile } from 'fs/promises';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { applyReplacement, countOccurrences, validateEdit } from './utils';
import { EDIT_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to modify'),
  old_string: z.string().describe('The text to replace'),
  new_string: z.string().describe('The text to replace it with (must be different from old_string)'),
  replace_all: z.boolean().default(false).describe(
    'Replace all occurrences of old_string (default false)',
  ),
});

@Injectable()
export class EditTool implements Tool<typeof inputSchema> {
  readonly name = EDIT_TOOL_NAME;
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

    let exists = false;
    try {
      const s = await stat(abs);
      if (s.isDirectory()) return err(`Path is a directory, not a file: ${input.file_path}`);
      exists = true;
    } catch {
      exists = false;
    }

    // File creation path: empty old_string + non-existent file
    if (!exists) {
      if (input.old_string === '') {
        try {
          await writeFile(abs, input.new_string, 'utf8');
          return ok(`File created: ${input.file_path}`);
        } catch (e) {
          return err(`Failed to create ${input.file_path}: ${(e as Error).message}`);
        }
      }
      return err(`File does not exist: ${input.file_path}`);
    }

    let content: string;
    try {
      content = await readFile(abs, 'utf8');
    } catch (e) {
      return err(`Failed to read ${input.file_path}: ${(e as Error).message}`);
    }

    const validationError = validateEdit(content, input.old_string, input.new_string, input.replace_all);
    if (validationError) return err(validationError);

    const matches = input.old_string === '' ? 1 : countOccurrences(content, input.old_string);
    const next = input.old_string === ''
      ? input.new_string
      : applyReplacement(content, input.old_string, input.new_string, input.replace_all);

    try {
      await writeFile(abs, next, 'utf8');
    } catch (e) {
      return err(`Failed to write ${input.file_path}: ${(e as Error).message}`);
    }
    const replaced = input.replace_all ? matches : Math.min(1, matches);
    return ok(`Made ${replaced} edit${replaced === 1 ? '' : 's'} to ${input.file_path}`);
  }
}
