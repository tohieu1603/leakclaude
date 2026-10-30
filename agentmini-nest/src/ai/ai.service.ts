// OpenAI-compatible streaming client with exponential-backoff retry.
// Yields normalized StreamChunks so the engine layer is provider-agnostic.

import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { sleep } from '../common/sleep';
import type { APIMessage, ToolDefinition } from '../common/types';

export type StreamChunk =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call'; id: string; name: string; argsJson: string }
  | { type: 'finish'; stopReason: string; usage: { promptTokens: number; completionTokens: number } };

export interface StreamParams {
  messages: APIMessage[];
  tools?: ToolDefinition[];
  model?: string;
  maxTokens?: number;
}

const MAX_API_RETRIES = 3;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.client = new OpenAI({ apiKey: config.ai.apiKey, baseURL: config.ai.baseUrl });
  }

  // Streaming generator. Caller can `for await` over chunks.
  // Retries the *initial connection* on transient failures; once chunks start
  // flowing we propagate errors so the engine layer can decide how to handle.
  async *stream(params: StreamParams): AsyncGenerator<StreamChunk> {
    const stream = await this.openStreamWithRetry(params);

    // Tool-call args arrive in fragments; accumulate per index.
    const acc = new Map<number, { id: string; name: string; argsJson: string }>();
    let promptTokens = 0;
    let completionTokens = 0;
    let stopReason: string | null = null;
    let finishEmitted = false;

    for await (const chunk of stream) {
      // With include_usage:true, the LAST chunk has choices=[] + usage filled.
      // Capture usage from any chunk that carries it (don't gate on choices).
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }

      const choice = chunk.choices[0];
      if (choice) {
        const delta = choice.delta;
        if (delta?.content) {
          yield { type: 'text_delta', text: delta.content };
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            const cur = acc.get(idx) ?? { id: '', name: '', argsJson: '' };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.argsJson += tc.function.arguments;
            acc.set(idx, cur);
          }
        }
        if (choice.finish_reason) stopReason = choice.finish_reason;
      }
    }

    // Emit pending tool_calls and finish exactly once, AFTER the stream ends.
    // Doing it here means usage-only chunks (which arrive after finish_reason)
    // get included in the totals.
    if (!finishEmitted) {
      for (const tc of acc.values()) {
        if (tc.name) yield { type: 'tool_call', id: tc.id, name: tc.name, argsJson: tc.argsJson };
      }
      yield {
        type: 'finish',
        stopReason: stopReason ?? 'stop',
        usage: { promptTokens, completionTokens },
      };
      finishEmitted = true;
    }
  }

  // Wrap stream creation in a retry loop for connection-level errors only
  private async openStreamWithRetry(params: StreamParams) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_API_RETRIES; attempt++) {
      try {
        return await this.client.chat.completions.create({
          model: params.model ?? this.config.ai.model,
          max_tokens: params.maxTokens ?? 8192,
          messages: params.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          ...(params.tools && params.tools.length > 0
            ? {
                tools: params.tools as OpenAI.Chat.Completions.ChatCompletionTool[],
                tool_choice: 'auto',
              }
            : {}),
          stream: true,
          // OpenAI-compat APIs only emit `usage` in streaming mode when this
          // is set. Without it, every turn ends with usage = {0, 0}.
          stream_options: { include_usage: true },
        });
      } catch (e: unknown) {
        lastErr = e;
        const status = (e as { status?: number })?.status;
        const retryable = status === undefined || RETRYABLE_STATUS.has(status);
        if (!retryable || attempt === MAX_API_RETRIES - 1) break;
        const backoff = 500 * Math.pow(2, attempt);
        this.logger.warn(`AI stream open failed (attempt ${attempt + 1}/${MAX_API_RETRIES}, status=${status}). Retrying in ${backoff}ms`);
        await sleep(backoff);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}
