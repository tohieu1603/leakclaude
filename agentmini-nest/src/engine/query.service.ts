// Async-generator agent loop modeled on Claude Code's query.ts.
//
// Fault-tolerance contract:
//  - Tool failures => returned to LLM as tool message with isError=true; loop continues.
//  - Stream exception mid-turn => yield 'turn_error' (recoverable), retry up to MAX_TURN_RETRIES.
//  - Bad JSON in tool_call args => surfaced to LLM as tool error; loop continues.
//  - maxTurns guard prevents infinite tool loops.
//  - Client disconnect (signal abort) => stop emitting events, cancel in-flight tools.
//  - Auto-compaction triggers pre-turn when token usage > threshold.
//
// Concurrency: tool calls within a single turn are split into:
//  - concurrency-safe (read-only by default) → run with Promise.all
//  - rest → run sequentially in the order the model emitted them

import { Injectable, Logger } from '@nestjs/common';
import { AiService, type StreamChunk } from '../ai/ai.service';
import { ToolRegistry } from '../tools/tool-registry.service';
import { CompactionService } from '../services/compaction/compaction.service';
import { HooksService } from '../hooks/hooks.service';
import { PermissionService } from '../permissions/permission.service';
import { ActiveSessionRef } from '../tools/shared/active-session-ref.service';
import { sleep } from '../common/sleep';
import type { APIMessage, SSEEvent, ToolCall } from '../common/types';

export interface QueryOptions {
  messages: APIMessage[];
  signal: AbortSignal;
  maxTurns?: number;
  model?: string;
  sessionId?: string;
  // Optional callback invoked after auto-compaction so the controller / session
  // service can persist the rewritten history. Kept as a callback (not a hard
  // dep) so QueryService stays decoupled from SessionService.
  onCompacted?: (stats: { before: number; after: number; freedTokens: number; manual: boolean }) => Promise<void> | void;
  // Optional callback invoked after each newly-appended message so the
  // controller can write through to disk per-turn.
  onMessageAppended?: (index: number) => Promise<void> | void;
}

const DEFAULT_MAX_TURNS = 20;
const MAX_TURN_RETRIES = 2;

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly ai: AiService,
    private readonly registry: ToolRegistry,
    private readonly compactor: CompactionService,
    private readonly hooks: HooksService,
    private readonly permissions: PermissionService,
    private readonly activeSession: ActiveSessionRef,
  ) {}

  // The async-generator loop. Mutates opts.messages in place so callers see
  // the full conversation history (including auto-compactions).
  async *run(opts: QueryOptions): AsyncGenerator<SSEEvent> {
    const maxTurns = opts.maxTurns ?? DEFAULT_MAX_TURNS;
    const sessionId = opts.sessionId ?? 'anon';
    // Expose sessionId to tools that don't take it explicitly (Plan mode,
    // AskUserQuestion, Memory). Single-server / no parallel turns per session
    // → a global ref is safe (see ActiveSessionRef for the caveat).
    this.activeSession.set(sessionId);
    let totalIn = 0;
    let totalOut = 0;
    let turnCount = 0;

    // Dedup guard. Some weaker models (kimi, smaller open-source) call the
    // exact same tool with the exact same args repeatedly when stuck. We
    // hash (name+args+result) per-turn — if the same triple appears 3 turns
    // in a row we inject a system reminder telling the model to try a
    // different approach, and break after the 4th to prevent runaway loops.
    const recentCalls: string[] = [];
    const REPEAT_LIMIT = 3;

    for (let turn = 0; turn < maxTurns; turn++) {
      if (opts.signal.aborted) break;
      turnCount = turn + 1;

      // Pre-turn auto-compaction. If history is over budget, summarize before
      // making another API call. We yield a tool_start/result-style notification
      // so the client UI can show what happened.
      if (this.compactor.shouldAutoCompact(opts.messages)) {
        try {
          // Cheap pass first — drops oversized tool results without an extra LLM call
          this.compactor.microCompact(opts.messages);
          if (this.compactor.shouldAutoCompact(opts.messages)) {
            const result = await this.compactor.compact(opts.messages, { manual: false });
            yield {
              type: 'tool_result',
              toolName: 'AutoCompact',
              toolId: 'auto-compact-' + turn,
              content: `Auto-compacted: ${result.stats.before} → ${result.stats.after} tokens (freed ${result.stats.freedTokens})`,
              isError: false,
            };
            if (opts.onCompacted) await opts.onCompacted({ ...result.stats, manual: false });
          }
        } catch (e) {
          // Soft failure: surface but keep going (compactor's circuit breaker will trip after 3)
          yield {
            type: 'turn_error',
            message: `Auto-compaction failed: ${(e as Error).message}`,
            recoverable: true,
          };
        }
      }

      const tools = this.registry.toDefinitions();

      // Run a single LLM turn with retry on transient stream errors
      const turnResult = await this.runTurnWithRetry(opts.messages, tools, opts.model, opts.signal);
      for (const ev of turnResult.events) yield ev;
      totalIn += turnResult.usage.promptTokens;
      totalOut += turnResult.usage.completionTokens;

      // Append assistant message regardless — even if it has zero tool_calls
      opts.messages.push({
        role: 'assistant',
        content: turnResult.assistantText || null,
        tool_calls: turnResult.toolCalls.length > 0 ? turnResult.toolCalls : undefined,
      });
      if (opts.onMessageAppended) await opts.onMessageAppended(opts.messages.length - 1);

      if (turnResult.toolCalls.length === 0) break;

      // Split tool calls by concurrency-safety. The order of results in the
      // history must still match the order the model emitted, so we run the
      // safe set in parallel and the unsafe set sequentially, then re-merge.
      const safeIdx: number[] = [];
      const unsafeIdx: number[] = [];
      for (let i = 0; i < turnResult.toolCalls.length; i++) {
        const tc = turnResult.toolCalls[i]!;
        if (this.registry.isConcurrencySafe(tc.function.name)) safeIdx.push(i);
        else unsafeIdx.push(i);
      }

      const results: Array<{ toolCallId: string; events: SSEEvent[]; toolMessage: APIMessage } | null> =
        new Array(turnResult.toolCalls.length).fill(null);

      // Run concurrency-safe ones in parallel
      await Promise.all(
        safeIdx.map(async (i) => {
          results[i] = await this.executeOne(turnResult.toolCalls[i]!, opts.signal, sessionId);
        }),
      );
      // Run rest sequentially (also useful so the LLM can observe ordering effects in writes)
      for (const i of unsafeIdx) {
        if (opts.signal.aborted) break;
        results[i] = await this.executeOne(turnResult.toolCalls[i]!, opts.signal, sessionId);
      }

      // Yield events + append messages in original order
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (!r) continue;
        for (const ev of r.events) yield ev;
        opts.messages.push(r.toolMessage);
        if (opts.onMessageAppended) await opts.onMessageAppended(opts.messages.length - 1);
      }

      // Detect runaway loops: same tool + same args + same result triple
      // repeating across turns. After REPEAT_LIMIT, inject a reminder; after
      // REPEAT_LIMIT+1, break the loop entirely.
      const fingerprints = turnResult.toolCalls.map((tc, i) => {
        const r = results[i];
        const resultDigest = r ? (r.toolMessage.content ?? '').slice(0, 200) : '';
        return `${tc.function.name}::${tc.function.arguments}::${resultDigest}`;
      });
      for (const fp of fingerprints) {
        recentCalls.push(fp);
        if (recentCalls.length > REPEAT_LIMIT + 1) recentCalls.shift();
      }
      const allSame = recentCalls.length >= REPEAT_LIMIT && recentCalls.every((f) => f === recentCalls[0]);
      if (allSame) {
        if (recentCalls.length === REPEAT_LIMIT) {
          // Inject a reminder so the model has a chance to course-correct
          opts.messages.push({
            role: 'user',
            content:
              '<system-reminder>You just invoked the same tool with the same arguments and got the same result multiple times in a row. Stop repeating. Either answer the user with what you already have, or try a fundamentally different approach.</system-reminder>',
          });
          if (opts.onMessageAppended) await opts.onMessageAppended(opts.messages.length - 1);
        } else {
          // Hard break — model ignored the reminder
          yield {
            type: 'turn_error',
            message: 'Aborted: model is stuck in a tool-call loop (same call repeated > REPEAT_LIMIT times).',
            recoverable: false,
          };
          break;
        }
      }
    }

    yield { type: 'done', inputTokens: totalIn, outputTokens: totalOut, turns: turnCount };
  }

  // Execute one tool call: emit tool_start + tool_result events; append a tool
  // message to history. JSON parse errors and tool exceptions are caught and
  // surfaced as tool_result with isError=true so the loop never breaks.
  //
  // Order of operations:
  //   1. parse args
  //   2. permission check (mode-aware)
  //   3. PreToolUse hook (can deny / rewrite input)
  //   4. execute
  //   5. PostToolUse hook (can rewrite output)
  private async executeOne(
    tc: ToolCall,
    signal: AbortSignal,
    sessionId: string,
  ): Promise<{ toolCallId: string; events: SSEEvent[]; toolMessage: APIMessage }> {
    const events: SSEEvent[] = [];

    let parsedArgs: unknown = {};
    try {
      parsedArgs = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch (e) {
      const msg = `Invalid JSON in tool arguments for "${tc.function.name}": ${(e as Error).message}`;
      events.push({ type: 'tool_start', toolName: tc.function.name, toolId: tc.id, input: tc.function.arguments });
      events.push({ type: 'tool_result', toolName: tc.function.name, toolId: tc.id, content: msg, isError: true });
      return {
        toolCallId: tc.id,
        events,
        toolMessage: { role: 'tool', tool_call_id: tc.id, content: msg },
      };
    }

    // Permission check
    const perm = this.permissions.canUseTool(sessionId, tc.function.name);
    if (!perm.allowed) {
      const msg = perm.reason ?? `Tool "${tc.function.name}" not permitted in current mode.`;
      events.push({ type: 'tool_start', toolName: tc.function.name, toolId: tc.id, input: parsedArgs });
      events.push({ type: 'tool_result', toolName: tc.function.name, toolId: tc.id, content: msg, isError: true });
      return {
        toolCallId: tc.id,
        events,
        toolMessage: { role: 'tool', tool_call_id: tc.id, content: msg },
      };
    }

    // PreToolUse hook — can deny or rewrite input
    const pre = await this.hooks.run({
      event: 'PreToolUse',
      sessionId,
      toolName: tc.function.name,
      toolId: tc.id,
      input: parsedArgs,
    });
    if (pre.decision === 'deny') {
      const msg = pre.reason ?? `Tool "${tc.function.name}" blocked by PreToolUse hook.`;
      events.push({ type: 'tool_start', toolName: tc.function.name, toolId: tc.id, input: parsedArgs });
      events.push({ type: 'tool_result', toolName: tc.function.name, toolId: tc.id, content: msg, isError: true });
      return {
        toolCallId: tc.id,
        events,
        toolMessage: { role: 'tool', tool_call_id: tc.id, content: msg },
      };
    }
    if (pre.decision === 'modify' && pre.newInput !== undefined) {
      parsedArgs = pre.newInput;
    }

    events.push({ type: 'tool_start', toolName: tc.function.name, toolId: tc.id, input: parsedArgs });
    let result = await this.registry.execute(tc.function.name, parsedArgs, signal);

    // PostToolUse hook — can rewrite output
    const post = await this.hooks.run({
      event: 'PostToolUse',
      sessionId,
      toolName: tc.function.name,
      toolId: tc.id,
      input: parsedArgs,
      output: result.content,
      isError: result.isError,
    });
    if (post.decision === 'modify' && typeof post.newOutput === 'string') {
      result = { content: post.newOutput, isError: result.isError };
    }

    events.push({
      type: 'tool_result',
      toolName: tc.function.name,
      toolId: tc.id,
      content: result.content,
      isError: result.isError,
    });
    return {
      toolCallId: tc.id,
      events,
      toolMessage: { role: 'tool', tool_call_id: tc.id, content: result.content },
    };
  }

  // Run a single LLM turn. Buffer events; retry transient stream errors with
  // exponential backoff. If all retries fail, return an empty turn with a
  // 'turn_error' event so the loop terminates gracefully.
  private async runTurnWithRetry(
    messages: APIMessage[],
    tools: ReturnType<ToolRegistry['toDefinitions']>,
    model: string | undefined,
    signal: AbortSignal,
  ): Promise<{
    events: SSEEvent[];
    assistantText: string;
    toolCalls: ToolCall[];
    usage: { promptTokens: number; completionTokens: number };
  }> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_TURN_RETRIES + 1; attempt++) {
      if (signal.aborted) break;

      const events: SSEEvent[] = [];
      let assistantText = '';
      const toolCalls: ToolCall[] = [];
      let usage = { promptTokens: 0, completionTokens: 0 };

      try {
        for await (const chunk of this.ai.stream({ messages, tools, model })) {
          if (signal.aborted) throw new Error('client cancelled');
          this.applyChunk(chunk, events, (txt) => (assistantText += txt), toolCalls, (u) => (usage = u));
        }
        return { events, assistantText, toolCalls, usage };
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Turn stream failed (attempt ${attempt + 1}/${MAX_TURN_RETRIES + 1}): ${msg}`);
        if (attempt < MAX_TURN_RETRIES && !signal.aborted) {
          await sleep(500 * Math.pow(2, attempt));
        }
      }
    }
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    return {
      events: [{ type: 'turn_error', message: msg, recoverable: false }],
      assistantText: '',
      toolCalls: [],
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }

  private applyChunk(
    chunk: StreamChunk,
    events: SSEEvent[],
    appendText: (t: string) => void,
    toolCalls: ToolCall[],
    setUsage: (u: { promptTokens: number; completionTokens: number }) => void,
  ): void {
    switch (chunk.type) {
      case 'text_delta':
        appendText(chunk.text);
        events.push({ type: 'text_delta', text: chunk.text });
        return;
      case 'tool_call':
        toolCalls.push({
          id: chunk.id,
          type: 'function',
          function: { name: chunk.name, arguments: chunk.argsJson },
        });
        return;
      case 'finish':
        setUsage(chunk.usage);
        return;
    }
  }
}
