export const RECALL_MEMORY_TOOL_NAME = 'RecallMemory';

export const PROMPT = `Read a specific long-term memory or list all available ones.

- Pass {} to list everything (name + description + type) — the MEMORY.md index format
- Pass { name } to read the full body of a single memory

Long-term memories survive across sessions. They contain user preferences, project decisions, references to external systems, and feedback corrections.

ALWAYS verify memory against current state before acting on it — file paths, function names, or flags mentioned in memory may be stale.`;
