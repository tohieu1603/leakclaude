import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { AgentRunner } from '../../agents/agent-runner.service';
import { TASK_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  description: z.string().min(1).describe('A short (3-5 word) description of the task'),
  prompt: z.string().min(10).describe('Self-contained instructions for the sub-agent'),
  agentType: z
    .enum(['general-purpose', 'explore', 'code-reviewer', 'researcher'])
    .default('general-purpose'),
});

@Injectable()
export class TaskTool implements Tool<typeof inputSchema> {
  readonly name = TASK_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;
  readonly concurrencySafe = true;
  readonly timeoutMs = 10 * 60 * 1000;
  readonly maxResultSizeChars = 200_000;

  constructor(
    @Inject(forwardRef(() => AgentRunner)) private readonly runner: AgentRunner,
  ) {}

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    try {
      const r = await this.runner.run({
        agentType: input.agentType,
        prompt: input.prompt,
        parentSignal: ctx.signal,
      });
      const header = `[${input.agentType} sub-agent — ${r.turns} turn(s), ${r.inputTokens}+${r.outputTokens} tokens${r.truncated ? ', truncated' : ''}]`;
      return ok(`${header}\n\n${r.text || '(no output)'}`);
    } catch (e) {
      return err(`Sub-agent failed: ${(e as Error).message}`);
    }
  }
}
