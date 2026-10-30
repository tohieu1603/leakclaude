// Cheap token estimator. Real tokenizers are model-specific; for budgeting
// we use the well-known "≈ 4 chars per token" heuristic that matches
// Anthropic + OpenAI English text well enough for autocompact thresholds.
// Image / structured-output tokens are over-counted on purpose so we err
// toward more frequent compaction.

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// Estimate total tokens for an OpenAI-shaped message array. Counts content
// strings + tool_call JSON + tool result content. Adds a small per-message
// overhead matching what Anthropic / OpenAI charge for role headers.
export function estimateMessagesTokens(
  messages: Array<{
    role: string;
    // Accept string | null | UserContentPart[] (image attachments etc.) without
    // importing the union from common/types — keep the estimator dependency-free.
    content: unknown;
    tool_calls?: unknown;
    tool_call_id?: string;
  }>,
): number {
  let total = 0;
  for (const m of messages) {
    total += 4; // per-message overhead
    if (typeof m.content === 'string') {
      total += estimateTokens(m.content);
    } else if (Array.isArray(m.content)) {
      // Multi-part content (text + images). Charge a flat "vision token"
      // budget for each image part and the literal text for text parts.
      for (const p of m.content) {
        if (p && typeof p === 'object') {
          const part = p as { type?: string; text?: string };
          if (part.type === 'text' && typeof part.text === 'string') total += estimateTokens(part.text);
          else if (part.type === 'image_url') total += 250; // rough vision-token estimate
        }
      }
    }
    if (m.tool_calls) total += estimateTokens(JSON.stringify(m.tool_calls));
    if (m.tool_call_id) total += estimateTokens(m.tool_call_id);
  }
  return total;
}
