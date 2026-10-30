import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { resolveSafePath } from '../shared/path-utils';
import { NOTEBOOK_EDIT_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z
  .strictObject({
    notebookPath: z.string().min(1),
    cellIndex: z.number().int().min(0),
    mode: z.enum(['replace', 'insert', 'delete']),
    cellType: z.enum(['code', 'markdown']).optional(),
    source: z.string().optional(),
  })
  .refine(
    (v) => v.mode === 'delete' || typeof v.source === 'string',
    { message: 'source is required for replace/insert' },
  );

interface NotebookCell {
  cell_type: 'code' | 'markdown';
  source: string | string[];
  metadata?: Record<string, unknown>;
  outputs?: unknown[];
  execution_count?: number | null;
}

interface Notebook {
  cells: NotebookCell[];
  metadata?: Record<string, unknown>;
  nbformat?: number;
  nbformat_minor?: number;
}

@Injectable()
export class NotebookEditTool implements Tool<typeof inputSchema> {
  readonly name = NOTEBOOK_EDIT_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    let abs: string;
    try { abs = resolveSafePath(this.config.workspaceRoot, input.notebookPath); }
    catch (e) { return err((e as Error).message); }
    if (!abs.endsWith('.ipynb')) return err(`Not a notebook file: ${abs}`);

    let nb: Notebook;
    try {
      const raw = await fs.readFile(abs, 'utf8');
      nb = JSON.parse(raw) as Notebook;
    } catch (e) {
      return err(`Failed to read notebook: ${(e as Error).message}`);
    }

    if (!Array.isArray(nb.cells)) return err('Notebook missing cells[] — not a valid .ipynb');

    if (input.mode === 'delete') {
      if (input.cellIndex >= nb.cells.length) {
        return err(`cellIndex ${input.cellIndex} out of range (notebook has ${nb.cells.length} cells)`);
      }
      nb.cells.splice(input.cellIndex, 1);
    } else {
      const cell: NotebookCell = {
        cell_type: input.cellType ?? 'code',
        source: input.source!,
        metadata: {},
      };
      if (cell.cell_type === 'code') {
        cell.outputs = [];
        cell.execution_count = null;
      }
      if (input.mode === 'replace') {
        if (input.cellIndex >= nb.cells.length) {
          return err(`cellIndex ${input.cellIndex} out of range`);
        }
        nb.cells[input.cellIndex] = cell;
      } else {
        // insert
        const idx = Math.min(input.cellIndex, nb.cells.length);
        nb.cells.splice(idx, 0, cell);
      }
    }

    try {
      await fs.writeFile(abs, JSON.stringify(nb, null, 1), 'utf8');
    } catch (e) {
      return err(`Failed to write notebook: ${(e as Error).message}`);
    }
    return ok(
      `${input.mode === 'delete' ? 'Deleted' : input.mode === 'replace' ? 'Replaced' : 'Inserted'} ` +
        `cell at index ${input.cellIndex}. Notebook now has ${nb.cells.length} cell(s).`,
    );
  }
}
