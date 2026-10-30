// MCP tool / prompt name normalisation.
//
// MCP servers in the wild expose tools with names like "GitHub: list-issues"
// or "filesystem.read_file" which break model APIs that restrict tool names
// to [a-zA-Z0-9_-]{1,64}. Claude Code maintains a small normaliser plus a
// reverse map; we follow the same approach so the original MCP name is
// preserved when calling the server but the model sees a safe identifier.

const MAX_LEN = 60; // leave room for the mcp__<server>__ prefix (<= 64 total)

export function normalizeMcpName(name: string): string {
  // Lower-case-friendly but preserve case where possible (some servers rely on it).
  // Replace any run of non-identifier chars with a single underscore.
  let cleaned = name.replace(/[^a-zA-Z0-9_-]+/g, '_');
  // Strip leading/trailing underscores
  cleaned = cleaned.replace(/^_+|_+$/g, '');
  if (!cleaned) cleaned = 'tool';
  if (cleaned.length > MAX_LEN) cleaned = cleaned.slice(0, MAX_LEN);
  return cleaned;
}

// Compose the full tool name Claude Code uses: mcp__<server>__<tool>.
export function buildMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${normalizeMcpName(serverName)}__${normalizeMcpName(toolName)}`;
}
