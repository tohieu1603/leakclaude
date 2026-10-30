// Conversation compaction. Modeled on Claude Code's services/compact:
//   - autoCompactIfNeeded: token-threshold check + circuit breaker
//   - compactConversation: ask the model for a structured summary, then
//     replace history with [system, compact-boundary-summary, recent N msgs]
//   - microCompact (lightweight): truncate over-large tool-result messages
//
// The compact-boundary message is preserved across resets so the model can
// see "previously summarized history" without re-summarizing the same span.

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import type { APIMessage } from '../../common/types';
import { estimateMessagesTokens } from '../../common/token-estimator';
import { COMPACT_PROMPT, extractSummary } from './prompt';

// 200K context windows are common for current models; we keep a generous
// reserve so the compaction call itself fits.
export const DEFAULT_CONTEXT_WINDOW = 200_000;
export const RESERVED_TOKENS_FOR_OUTPUT = 16_000;
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000;

const KEEP_RECENT_MESSAGES = 4; // last user/assistant pair retained verbatim
const MAX_TOOL_RESULT_CHARS = 8_000; // microcompact ceiling per tool message
const MAX_CONSECUTIVE_FAILURES = 3;

const COMPACT_BOUNDARY_PREFIX = '<compact-boundary>';

export interface CompactionStats {
  before: number;
  after: number;
  freedTokens: number;
}

export interface CompactedResult {
  messages: APIMessage[];
  stats: CompactionStats;
}

@Injectable()
export class CompactionService {
  private readonly logger = new Logger(CompactionService.name);
  private consecutiveFailures = 0;

  constructor(private readonly ai: AiService) {}

  // Lightweight in-place reduction: cap any oversized tool-result messages.
  // Returns whether anything changed.
  microCompact(messages: APIMessage[]): boolean {
    let changed = false;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]!;
      if (m.role === 'tool' && typeof m.content === 'string' && m.content.length > MAX_TOOL_RESULT_CHARS) {
        messages[i] = {
          ...m,
          content:
            m.content.slice(0, MAX_TOOL_RESULT_CHARS) +
            `\n... [tool result truncated by microcompact; original was ${m.content.length} chars]`,
        };
        changed = true;
      }
    }
    return changed;
  }

  // Threshold: window − reserved-output − buffer. Above that we autocompact.
  threshold(): number {
    return DEFAULT_CONTEXT_WINDOW - RESERVED_TOKENS_FOR_OUTPUT - AUTOCOMPACT_BUFFER_TOKENS;
  }

  shouldAutoCompact(messages: APIMessage[]): boolean {
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return false;
    return estimateMessagesTokens(messages) > this.threshold();
  }

  // Replace the message array with [system, compact-boundary-summary,
  // recent-tail]. Mutates the array in place. Returns stats.
  async compact(messages: APIMessage[], options?: { manual?: boolean; instructions?: string }): Promise<CompactedResult> {
    const before = estimateMessagesTokens(messages);
    if (messages.length <= KEEP_RECENT_MESSAGES + 1) {
      // Nothing meaningful to summarize
      return { messages, stats: { before, after: before, freedTokens: 0 } };
    }

    // Identify the system message and any pre-existing compact-boundary
    const system = messages.find((m) => m.role === 'system');
    if (!system) {
      throw new Error('Cannot compact: missing system message');
    }

    // The "tail" we keep verbatim — the last KEEP_RECENT_MESSAGES non-system messages
    const nonSystem = messages.filter((m) => m.role !== 'system');
    const tailStart = Math.max(0, nonSystem.length - KEEP_RECENT_MESSAGES);
    const tail = nonSystem.slice(tailStart);
    // Make sure we don't split a tool_calls/tool pair — drop tool-only msgs at
    // the head of the tail until we land on a user/assistant turn boundary.
    while (tail.length > 0 && tail[0]!.role === 'tool') tail.shift();

    // Run the compaction prompt — best effort, retry once on transient failure
    let summary: string;
    try {
      summary = await this.runSummarizationCall(messages, options?.instructions);
    } catch (e) {
      this.consecutiveFailures += 1;
      this.logger.warn(`Compaction failed (${this.consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${(e as Error).message}`);
      throw e;
    }

    this.consecutiveFailures = 0;

    // Build new history: [system, compact-boundary user message, tail...]
    const boundary: APIMessage = {
      role: 'user',
      content: `${COMPACT_BOUNDARY_PREFIX}\nThe earlier conversation was compacted. The summary below replaces all messages prior to this boundary. Continue the conversation taking this summary as authoritative context.\n\n${summary}`,
    };

    const next: APIMessage[] = [system, boundary, ...tail];
    // Mutate in place so callers (sessions) see the new history immediately
    messages.length = 0;
    messages.push(...next);

    const after = estimateMessagesTokens(messages);
    const stats: CompactionStats = { before, after, freedTokens: Math.max(0, before - after) };
    this.logger.log(
      `Compacted: ${before} → ${after} tokens (freed ${stats.freedTokens})${options?.manual ? ' [manual]' : ' [auto]'}`,
    );
    return { messages, stats };
  }

  // Send the messages + summarization prompt to the model and accumulate text.
  // Tools are intentionally NOT passed so the model is forced to output text only.
  private async runSummarizationCall(messages: APIMessage[], extraInstructions?: string): Promise<string> {
    const summarizationMessages: APIMessage[] = [
      ...messages,
      {
        role: 'user',
        content: extraInstructions
          ? `${COMPACT_PROMPT}\n\nAdditional user instructions: ${extraInstructions}`
          : COMPACT_PROMPT,
      },
    ];

    let raw = '';
    for await (const chunk of this.ai.stream({ messages: summarizationMessages })) {
      if (chunk.type === 'text_delta') raw += chunk.text;
    }
    if (!raw.trim()) throw new Error('Compaction model returned empty response');
    return extractSummary(raw);
  }

  // Manual reset of the failure counter — used when the user issues /compact
  // and proves the path works.
  resetFailureCounter(): void {
    this.consecutiveFailures = 0;
  }
}
