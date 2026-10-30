// Centralized types: API messages, tool definitions, SSE events

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

// Multi-modal content parts for user messages. Models that support vision
// accept a mix of text + image_url parts; non-vision models silently ignore
// the image parts (OpenAI-compat behavior), so this is forward-compatible.
export type UserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

export type APIMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | UserContentPart[] }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// SSE events streamed to browser
export type SSEEvent =
  | { type: 'session_id'; sessionId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; toolName: string; toolId: string; input: unknown }
  | { type: 'tool_result'; toolName: string; toolId: string; content: string; isError: boolean }
  | { type: 'turn_error'; message: string; recoverable: boolean }
  | { type: 'ask_user'; questionId: string; question: string; options: Array<{ label: string; description?: string }>; multiSelect: boolean }
  | { type: 'mode_changed'; mode: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; turns: number }
  | { type: 'error'; message: string };
