import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { BackgroundShellService } from '../shared/background-shell.service';
import { KILL_SHELL_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  shellId: z.string().min(1),
  signal: z.enum(['SIGTERM', 'SIGKILL', 'SIGINT', 'SIGHUP']).optional(),
});

@Injectable()
export class KillShellTool implements Tool<typeof inputSchema> {
  readonly name = KILL_SHELL_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(private readonly bgShells: BackgroundShellService) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const r = this.bgShells.kill(input.shellId, input.signal ?? 'SIGTERM');
    if (!r.ok) return err(r.error);
    return ok(r.killed ? `Killed ${input.shellId}` : `${input.shellId} was already exited`);
  }
}
