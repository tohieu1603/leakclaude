export const LIST_MCP_RESOURCES_TOOL_NAME = 'ListMcpResources';

export const PROMPT = `List available resources from configured MCP servers.

Each MCP server exposes addressable, read-only blobs called resources (think files or rows). Use this tool first to see what URIs are available, then use ReadMcpResource with a specific URI to fetch the contents.

Usage:
- Omit the \`server\` argument to list resources across all connected MCP servers.
- Pass \`server\` to restrict the listing to a single MCP server (matches the server name in .mcp.json).
- The returned URI strings can be passed verbatim to ReadMcpResource.`;
