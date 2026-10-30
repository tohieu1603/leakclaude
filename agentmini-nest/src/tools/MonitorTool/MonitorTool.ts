import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { BackgroundShellService } from '../shared/background-shell.service';
import { MONITOR_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  shellId: z.string().min(1),
  timeoutMs: z.number().int().min(100).max(600_000).optional(),
  untilPattern: z.string().optional(),
  untilExit: z.boolean().optional(),
});

@Injectable()
export class MonitorTool implements Tool<typeof inputSchema> {
  readonly name = MONITOR_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = false;
  readonly timeoutMs = 605_000;

  constructor(private readonly bgShells: BackgroundShellService) {}

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    const timeoutMs = input.timeoutMs ?? 30_000;
    const untilExit = input.untilExit ?? true;
    let pattern: RegExp | null = null;
    if (input.untilPattern) {
      try { pattern = new RegExp(input.untilPattern); } catch (e) {
        return err(`Invalid untilPattern regex: ${(e as Error).message}`);
      }
    }
    // Drain anything already buffered so the wait reflects only NEW output.
    const drained = this.bgShells.readOutput(input.shellId, { stream: 'both' });
    if (!drained.ok) return err(drained.error);
    if (!this.bgShells.isRunning(input.shellId)) {
      return ok(`[${input.shellId}] already exited (code=${this.bgShells.exitCode(input.shellId)})\n${drained.text}`);
    }

    return new Promise<ToolResult>((resolve) => {
      const collected: string[] = [];
      const done = (reason: 'exited' | 'matched' | 'timed_out' | 'aborted') => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        unsub();
        const exitCode = this.bgShells.exitCode(input.shellId);
        const tail = this.bgShells.readOutput(input.shellId, { stream: 'both' });
        const body = collected.join('') + (tail.ok ? tail.text : '');
        resolve(ok(
          `[${input.shellId}] resolved=${reason}` +
            (reason === 'exited' ? ` exitCode=${exitCode}` : '') +
            '\n' +
            (body || '(no output)'),
        ));
      };
      let resolved = false;
      const unsub = this.bgShells.subscribe(input.shellId, ({ text }) => {
        collected.push(text);
        if (pattern && pattern.test(collected.join(''))) done('matched');
        else if (untilExit && !this.bgShells.isRunning(input.shellId)) done('exited');
      });
      const timer = setTimeout(() => done('timed_out'), timeoutMs);
      ctx.signal.addEventListener('abort', () => done('aborted'), { once: true });
    });
  }
}
