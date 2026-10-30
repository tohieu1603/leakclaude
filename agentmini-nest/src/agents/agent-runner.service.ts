// Spawns a sub-agent for the Task tool. A sub-agent runs the same QueryService
// loop but with:
//   - a fresh apiMessages array (NOT the parent's history) — keeps the main
//     context clean
//   - an optional filtered tool set (some agent types should only have read-only
//     tools; some should not be allowed to recurse via Task)
//   - a system prompt tailored to the agent type
//   - its own AbortController derived from the parent's signal
//
// Output is captured and returned as a single string (the assistant's final
// text). All sub-agent events are also forwarded to a logger for debug, but
// not streamed to the parent client — Claude Code does the same.

import { Injectable, Logger } from '@nestjs/common';
import { QueryService } from '../engine/query.service';
import { randomUUID } from 'crypto';
import type { APIMessage } from '../common/types';

export interface SubAgentRunOptions {
  agentType: 'general-purpose' | 'explore' | 'code-reviewer' | 'researcher';
  prompt: string;
  parentSignal: AbortSignal;
  maxTurns?: number;
}

export interface SubAgentResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  turns: number;
  truncated: boolean;
}

const SYSTEM_PROMPTS: Record<SubAgentRunOptions['agentType'], string> = {
  'general-purpose': `You are a general-purpose sub-agent invoked via the Task tool. You have the full tool catalogue (except Task, which would let you recurse). Complete the task and return a concise final answer.`,
  explore: `You are a fast, read-only Explore sub-agent. Use Glob/Grep/Read to find files matching the user's query. Return a short report with file paths and 1-line summaries. Do NOT edit anything.`,
  'code-reviewer': `You are a code-reviewer sub-agent. Read the files in scope, look for bugs, security issues, performance pitfalls, and style violations. Return a structured review report. Do NOT edit anything — only report.`,
  researcher: `You are a research sub-agent. Use WebSearch + WebFetch + Read to gather information on the user's topic. Return a synthesised report with citations.`,
};

@Injectable()
export class AgentRunner {
  private readonly logger = new Logger(AgentRunner.name);

  constructor(private readonly query: QueryService) {}

  async run(opts: SubAgentRunOptions): Promise<SubAgentResult> {
    const sid = `subagent_${randomUUID().slice(0, 8)}`;
    const messages: APIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS[opts.agentType] },
      { role: 'user', content: opts.prompt },
    ];

    const finalText: string[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let turns = 0;
    let truncated = false;

    const ctrl = new AbortController();
    const aborter = () => ctrl.abort(opts.parentSignal.reason);
    if (opts.parentSignal.aborted) aborter();
    else opts.parentSignal.addEventListener('abort', aborter, { once: true });

    try {
      for await (const ev of this.query.run({
        messages,
        signal: ctrl.signal,
        sessionId: sid,
        maxTurns: opts.maxTurns ?? 10,
      })) {
        switch (ev.type) {
          case 'text_delta':
            finalText.push(ev.text);
            break;
          case 'done':
            inputTokens = ev.inputTokens;
            outputTokens = ev.outputTokens;
            turns = ev.turns;
            break;
          case 'turn_error':
            this.logger.warn(`Sub-agent ${sid} turn error: ${ev.message}`);
            if (!ev.recoverable) truncated = true;
            break;
          default:
            break;
        }
      }
    } finally {
      opts.parentSignal.removeEventListener('abort', aborter);
    }

    return { text: finalText.join('').trim(), inputTokens, outputTokens, turns, truncated };
  }
}
