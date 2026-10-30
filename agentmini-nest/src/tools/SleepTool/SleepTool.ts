// Sleep — pause execution for a bounded duration.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { PROMPT, SLEEP_TOOL_NAME } from './prompt';

const inputSchema = z.strictObject({
  ms: z.number().int().min(50).max(60_000).describe('Milliseconds to sleep (max 60000)'),
  reason: z.string().optional().describe('Short explanation of why you are sleeping (for logging)'),
});

@Injectable()
export class SleepTool implements Tool<typeof inputSchema> {
  readonly name = SLEEP_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly timeoutMs = 65_000;

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    const start = Date.now();
    // Resolve early if the signal aborts so a long sleep doesn't pin the turn.
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, input.ms);
      ctx.signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    if (ctx.signal.aborted) return err('Sleep was cancelled');
    const elapsed = Date.now() - start;
    return ok(`Slept ${elapsed}ms${input.reason ? ` — ${input.reason}` : ''}`);
  }
}
