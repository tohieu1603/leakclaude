export const REMEMBER_TOOL_NAME = 'Remember';

export const PROMPT = `Save a piece of long-term memory to the agent's persistent memory store. Use this when:
- the user explicitly asks you to remember something
- the user corrects your approach in a way that should persist (feedback)
- you learn something about the user's role, preferences, or the project that will be useful in future sessions
- you discover an external system reference (Linear project, Slack channel, dashboard URL)

DO NOT save:
- conventions or architecture derivable from grep
- ephemeral task state (use TodoWrite)
- secrets, credentials, or PII

Parameters:
- name: short identifier (a-z, 0-9, _, -)
- description: one-line summary that future-you will use to decide if this memory is relevant
- type: one of 'user' | 'feedback' | 'project' | 'reference'
- content: the memory body in markdown`;
