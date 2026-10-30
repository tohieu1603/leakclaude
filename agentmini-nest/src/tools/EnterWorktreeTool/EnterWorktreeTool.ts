import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { WorktreeRegistry } from '../shared/worktree-registry.service';
import { ENTER_WORKTREE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  baseBranch: z.string().optional(),
});

@Injectable()
export class EnterWorktreeTool implements Tool<typeof inputSchema> {
  readonly name = ENTER_WORKTREE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(
    private readonly worktrees: WorktreeRegistry,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    try {
      const entry = await this.worktrees.create(this.config.workspaceRoot, input.baseBranch);
      return ok(
        `Created worktree ${entry.id}\n` +
          `Path:       ${entry.path}\n` +
          `Branch:     ${entry.branch}\n` +
          `Forked from: ${entry.baseBranch}\n\n` +
          `Use Bash with cd ${entry.path} to work inside it. Call ExitWorktree({"id":"${entry.id}"}) to clean up.`,
      );
    } catch (e) {
      return err(`Failed to create worktree: ${(e as Error).message}`);
    }
  }
}
