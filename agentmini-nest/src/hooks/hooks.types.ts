// Hook system modeled on Claude Code's hooks. Hooks run shell commands at
// specific lifecycle events. A hook can return JSON on stdout to influence
// what the engine does next (e.g. abort a tool call, inject extra context).

export type HookEvent =
  | 'PreToolUse'   // about to invoke a tool — hook can deny or rewrite input
  | 'PostToolUse'  // tool finished — hook can rewrite the result
  | 'UserPromptSubmit' // user sent a message — hook can inject context
  | 'SessionStart' // session just created / resumed
  | 'Stop';        // agent loop is exiting normally

// One configured hook definition (the user writes these in hooks.json).
export interface HookConfig {
  // Shell command to run. Stdin is the JSON payload, stdout is parsed as
  // the response (see HookResponse). Stderr is logged.
  readonly command: string;
  // Optional matcher — only fire on certain tool names (regex). Ignored
  // for non-tool events.
  readonly matcher?: string;
  // Soft timeout in milliseconds.
  readonly timeoutMs?: number;
  // Disable a hook without removing the config entry.
  readonly disabled?: boolean;
}

// Whole config — maps each event to an array of hook configs.
export type HooksFile = Partial<Record<HookEvent, HookConfig[]>>;

// Payload sent to the hook on stdin (varies by event).
export type HookPayload =
  | { event: 'PreToolUse'; sessionId: string; toolName: string; toolId: string; input: unknown }
  | { event: 'PostToolUse'; sessionId: string; toolName: string; toolId: string; input: unknown; output: string; isError: boolean }
  | { event: 'UserPromptSubmit'; sessionId: string; message: string }
  | { event: 'SessionStart'; sessionId: string; resumed: boolean }
  | { event: 'Stop'; sessionId: string; turns: number; inputTokens: number; outputTokens: number };

// Hook response — parsed from hook stdout. Missing/invalid → treat as
// "no opinion" (pass-through). The decision field is the only authoritative
// field; everything else is advisory text that the engine forwards to the LLM.
export interface HookResponse {
  // 'allow' = continue (default), 'deny' = abort this tool call with the
  // given message, 'modify' = rewrite input/output with the given payload.
  decision?: 'allow' | 'deny' | 'modify';
  reason?: string;
  // For PreToolUse modify: replace input with this object.
  newInput?: unknown;
  // For PostToolUse modify: replace tool output with this string.
  newOutput?: string;
  // For UserPromptSubmit: extra context to inject as a system reminder.
  additionalContext?: string;
}
