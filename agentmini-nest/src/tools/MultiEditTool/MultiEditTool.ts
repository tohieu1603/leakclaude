// MultiEdit — apply N edits to one file atomically.

import { Inject, Injectable } from '@nestjs/common';
import { readFile, stat, writeFile } from 'fs/promises';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { resolveSafePath } from '../shared/path-utils';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { applyReplacement, countOccurrences, validateEdit } from '../EditTool/utils';
import { MULTI_EDIT_TOOL_NAME, PROMPT } from './prompt';

const editSchema = z.strictObject({
  old_string: z.string().describe('The text to replace'),
  new_string: z.string().describe('The text to replace it with'),
  replace_all: z.boolean().default(false).describe('Replace all occurrences (default false)'),
});

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to modify'),
  edits: z.array(editSchema).min(1).describe(
    'Array of edits to apply sequentially. Each operates on the result of the previous edit.',
  ),
});

@Injectable()
export class MultiEditTool implements Tool<typeof inputSchema> {
  readonly name = MULTI_EDIT_TOOL_NAME;
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

    let original: string;
    try {
      const s = await stat(abs);
      if (s.isDirectory()) return err(`Path is a directory, not a file: ${input.file_path}`);
      original = await readFile(abs, 'utf8');
    } catch {
      // Allow creation only when first edit has empty old_string
      const first = input.edits[0];
      if (!first || first.old_string !== '') {
        return err(`File does not exist: ${input.file_path}`);
      }
      original = '';
    }

    let working = original;
    let totalReplaced = 0;

    for (let i = 0; i < input.edits.length; i++) {
      const edit = input.edits[i]!;
      const validationError = validateEdit(working, edit.old_string, edit.new_string, edit.replace_all);
      if (validationError) {
        return err(`Edit ${i + 1}/${input.edits.length} failed: ${validationError}`);
      }
      if (edit.old_string === '') {
        working = edit.new_string;
        totalReplaced += 1;
      } else {
        const matches = countOccurrences(working, edit.old_string);
        working = applyReplacement(working, edit.old_string, edit.new_string, edit.replace_all);
        totalReplaced += edit.replace_all ? matches : 1;
      }
    }

    try {
      await writeFile(abs, working, 'utf8');
    } catch (e) {
      return err(`Failed to write ${input.file_path}: ${(e as Error).message}`);
    }
    return ok(`Applied ${input.edits.length} edit(s) (${totalReplaced} replacement(s)) to ${input.file_path}`);
  }
}
