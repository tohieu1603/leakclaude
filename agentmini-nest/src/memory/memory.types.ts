// File-based long-term memory modeled on Claude Code's auto-memory system.
// Each memory is its own markdown file with YAML-ish frontmatter; an
// MEMORY.md index lists pointers. Memory survives across sessions and is
// loaded into the conversation at SessionStart.

export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';

export interface MemoryRecord {
  name: string;            // file name (without .md)
  description: string;
  type: MemoryType;
  content: string;         // markdown body
  updatedAt: string;
  path: string;            // absolute path on disk
}

export interface MemoryListEntry {
  name: string;
  description: string;
  type: MemoryType;
}
