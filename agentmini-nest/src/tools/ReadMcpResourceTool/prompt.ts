export const READ_MCP_RESOURCE_TOOL_NAME = 'ReadMcpResource';

export const PROMPT = `Read the contents of a specific MCP resource by URI.

MCP resources are addressable, read-only blobs (documents, rows, snippets) exposed by an MCP server. Use ListMcpResources first to discover available URIs, then call this tool with the chosen \`uri\` and the \`server\` that owns it.

Usage:
- The \`server\` argument identifies which MCP server owns the resource (matches .mcp.json).
- The \`uri\` argument is the resource URI returned by ListMcpResources.
- For text resources the content is returned verbatim. Binary resources are summarised with their MIME type and a short base64 preview.`;
