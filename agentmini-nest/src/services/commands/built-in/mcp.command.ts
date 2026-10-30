// /mcp — show MCP connection status (mirrors Claude Code's /mcp command).
// Lists every configured server with state (connected/failed/disabled) plus
// counts of tools/resources/prompts so users can troubleshoot quickly.

import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { McpRegistry } from '../../../mcp/mcp-registry.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class McpCommand implements SlashCommand {
  readonly name = 'mcp';
  readonly description = 'Show MCP server connection status (transport, state, capabilities)';

  // forwardRef because the MCP registry lives in a separate module that
  // depends on tools (the dependency chain is convoluted enough to need it).
  constructor(@Inject(forwardRef(() => McpRegistry)) private readonly mcp: McpRegistry) {}

  async call(_args: string, _ctx: CommandContext): Promise<CommandResult> {
    const clients = this.mcp.all();
    if (clients.length === 0) {
      return { type: 'text', value: 'No MCP servers configured. Create a .mcp.json to enable.' };
    }
    const lines = ['MCP servers:'];
    for (const c of clients) {
      const s = c.state;
      let detail = `(${c.transportType}, ${s.status})`;
      if (s.status === 'connected') {
        const caps = Object.keys(s.capabilities).join(', ') || 'none';
        detail = `(${c.transportType}, connected; caps: ${caps})`;
      } else if (s.status === 'failed') {
        detail = `(${c.transportType}, failed: ${s.error})`;
      }
      lines.push(`  ${c.serverName.padEnd(20)} ${detail}`);
    }
    return { type: 'text', value: lines.join('\n') };
  }
}
