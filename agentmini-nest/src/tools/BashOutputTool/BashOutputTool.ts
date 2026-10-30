import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { BackgroundShellService } from '../shared/background-shell.service';
import { BASH_OUTPUT_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  shellId: z.string().min(1).describe('Background shell id returned by Bash(run_in_background:true)'),
  stream: z.enum(['stdout', 'stderr', 'both']).optional(),
  reset: z.boolean().optional(),
});

@Injectable()
export class BashOutputTool implements Tool<typeof inputSchema> {
  readonly name = BASH_OUTPUT_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = true;

  constructor(private readonly bgShells: BackgroundShellService) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const r = this.bgShells.readOutput(input.shellId, { stream: input.stream, reset: input.reset });
    if (!r.ok) return err(r.error);
    const header = `[${input.shellId}] ${r.isRunning ? 'running' : `exited code=${r.exitCode}`}`;
    const body = r.text.length === 0 ? '(no new output)' : r.text;
    return ok(`${header}\n${body}`);
  }
}
