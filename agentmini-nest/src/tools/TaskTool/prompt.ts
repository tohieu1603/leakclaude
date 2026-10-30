export const TASK_TOOL_NAME = 'Task';

export const PROMPT = `Launch a sub-agent to handle a focused, multi-step task in its own isolated context. The sub-agent has its own conversation window and message history; it does NOT see the parent conversation. Use Task to:

- offload broad codebase exploration so the main context stays clean
- delegate independent research (docs / web)
- run a code review pass on already-implemented work
- execute long, multi-tool investigations that would otherwise fill the main context

Parameters:
- description: short (3-5 word) handle for the task
- prompt: full self-contained instructions for the sub-agent (no shared context)
- agentType: one of 'general-purpose', 'explore', 'code-reviewer', 'researcher'

Returns the sub-agent's final text answer plus a small usage summary. The result is returned in full — large answers will be truncated by the tool registry's size cap.

NOTE: a sub-agent cannot call Task itself (no recursion). Plan your delegation in one level.`;
