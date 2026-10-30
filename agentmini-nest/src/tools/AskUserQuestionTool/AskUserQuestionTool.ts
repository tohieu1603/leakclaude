import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok } from '../tool.interface';
import { UserQuestionBus } from '../shared/user-question-bus.service';
import { ActiveSessionRef } from '../shared/active-session-ref.service';
import { ASK_USER_QUESTION_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  question: z.string().min(3),
  options: z
    .array(z.object({ label: z.string().min(1), description: z.string().optional() }))
    .min(2)
    .max(6),
  multiSelect: z.boolean().optional(),
  timeoutMs: z.number().int().min(1_000).max(15 * 60 * 1000).optional(),
});

@Injectable()
export class AskUserQuestionTool implements Tool<typeof inputSchema> {
  readonly name = ASK_USER_QUESTION_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = false;
  // Set generously — the user might take a while to answer.
  readonly timeoutMs = 16 * 60 * 1000;

  constructor(
    private readonly bus: UserQuestionBus,
    private readonly activeSession: ActiveSessionRef,
  ) {}

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    const sid = this.activeSession.get();
    const { promise } = this.bus.ask(
      sid,
      input.question,
      input.options,
      input.multiSelect ?? false,
      input.timeoutMs ?? 5 * 60 * 1000,
    );
    // Resolve early if the request is aborted (client disconnected)
    const aborted = new Promise<null>((resolve) => {
      ctx.signal.addEventListener('abort', () => resolve(null), { once: true });
    });
    const answer = await Promise.race([promise, aborted]);
    if (!answer) return ok(`(no answer given within timeout — proceed with your best default)`);
    return ok(`User selected: ${answer.join(', ')}`);
  }
}
