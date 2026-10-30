// ReadMcpResource — fetch a single MCP resource by (server, uri).
// Mirrors Claude Code's tool of the same name.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../../mcp/mcp-registry.service';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { PROMPT, READ_MCP_RESOURCE_TOOL_NAME } from './prompt';

const inputSchema = z.strictObject({
  server: z.string().describe('The MCP server name as configured in .mcp.json.'),
  uri: z.string().describe('The resource URI to read (as returned by ListMcpResources).'),
});

@Injectable()
export class ReadMcpResourceTool implements Tool<typeof inputSchema> {
  readonly name = READ_MCP_RESOURCE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = true;

  constructor(private readonly registry: McpRegistry) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    const client = this.registry.get(input.server);
    if (!client) {
      return err(`No MCP server named "${input.server}". Use ListMcpResources to see available servers.`);
    }
    if (client.state.status !== 'connected') {
      return err(`MCP server "${input.server}" is not connected (state: ${client.state.status}).`);
    }
    try {
      const result = await client.readResource(input.uri);
      return result.isError ? err(result.content) : ok(result.content);
    } catch (e) {
      return err(`readResource failed: ${(e as Error).message}`);
    }
  }
}
