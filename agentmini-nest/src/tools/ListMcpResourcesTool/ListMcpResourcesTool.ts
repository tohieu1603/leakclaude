// ListMcpResources — built-in tool that queries every connected MCP server
// for its exposed resources. Mirrors Claude Code's tool of the same name.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../../mcp/mcp-registry.service';
import { type Tool, type ToolCallContext, type ToolResult, ok } from '../tool.interface';
import { LIST_MCP_RESOURCES_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  server: z
    .string()
    .optional()
    .describe('Optional MCP server name to filter the listing (omit for all connected servers).'),
});

@Injectable()
export class ListMcpResourcesTool implements Tool<typeof inputSchema> {
  readonly name = LIST_MCP_RESOURCES_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = true;

  constructor(private readonly registry: McpRegistry) {}

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    const clients = this.registry
      .connected()
      .filter((c) => !input.server || c.serverName === input.server);
    if (clients.length === 0) {
      return ok(
        input.server
          ? `No connected MCP server named "${input.server}".`
          : 'No connected MCP servers.',
      );
    }

    const lines: string[] = [];
    for (const c of clients) {
      const res = await c.listResources();
      if (res.length === 0) {
        lines.push(`# ${c.serverName} (no resources)`);
        continue;
      }
      lines.push(`# ${c.serverName} — ${res.length} resource(s)`);
      for (const r of res) {
        const desc = r.description ? ` — ${r.description}` : '';
        const mime = r.mimeType ? ` [${r.mimeType}]` : '';
        lines.push(`  ${r.uri}${mime}${desc}`);
      }
      lines.push('');
    }
    return ok(lines.join('\n').trim());
  }
}
