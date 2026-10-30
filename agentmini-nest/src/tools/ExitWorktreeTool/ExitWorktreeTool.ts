import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { WorktreeRegistry } from '../shared/worktree-registry.service';
import { EXIT_WORKTREE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  id: z.string().min(1),
  keepBranch: z.boolean().optional(),
});

@Injectable()
export class ExitWorktreeTool implements Tool<typeof inputSchema> {
  readonly name = EXIT_WORKTREE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(private readonly worktrees: WorktreeRegistry) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const r = await this.worktrees.remove(input.id, { keepBranch: input.keepBranch });
    if (!r.removed) return err(`No worktree with id "${input.id}"`);
    const branchNote = r.hadChanges
      ? `Branch "${r.branch}" preserved (uncommitted changes were present).`
      : input.keepBranch
        ? `Branch "${r.branch}" preserved (keepBranch=true).`
        : `Branch "${r.branch}" deleted.`;
    return ok(`Removed worktree ${input.id} at ${r.path}\n${branchNote}`);
  }
}
