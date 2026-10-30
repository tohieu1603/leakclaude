// Central registry that holds all McpClient instances after bootstrap.
//
// Consumed by:
//  - McpBootstrap: writes here on startup
//  - ListMcpResourcesTool + ReadMcpResourceTool: queries connected clients
//  - /mcp slash command: reports connection state
//  - Prompt-as-command bridge: looks up prompts on the right client

import { Injectable } from '@nestjs/common';
import type { McpClient } from './mcp-client.service';

@Injectable()
export class McpRegistry {
  private readonly clients = new Map<string, McpClient>();

  add(client: McpClient): void {
    this.clients.set(client.serverName, client);
  }

  remove(name: string): void {
    this.clients.delete(name);
  }

  all(): McpClient[] {
    return Array.from(this.clients.values());
  }

  connected(): McpClient[] {
    return this.all().filter((c) => c.state.status === 'connected');
  }

  get(name: string): McpClient | undefined {
    return this.clients.get(name);
  }
}
