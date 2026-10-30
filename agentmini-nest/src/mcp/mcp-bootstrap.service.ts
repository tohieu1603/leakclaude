// MCP lifecycle driver.
//
// On module init:
//   1. Load .mcp.json (env-var expansion applied)
//   2. Open a client per server in parallel (stdio / http / sse)
//   3. For each connected server: list_tools → register as adapter; list_prompts
//      → register a McpPromptCommand on the global CommandRegistry
//   4. Track every client in McpRegistry so the ListMcpResources /
//      ReadMcpResource built-in tools can query them on demand
//
// On module destroy: unregister tools, close clients, clean up child processes.
//
// A failing server is isolated: log + skip; everything else continues.

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ToolRegistry } from '../tools/tool-registry.service';
import { CommandRegistry } from '../services/commands/command-registry.service';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { loadMcpConfig, type McpConfig } from './mcp-config';
import { McpClient } from './mcp-client.service';
import { McpToolAdapter } from './mcp-tool.adapter';
import { McpRegistry } from './mcp-registry.service';
import { McpPromptCommand } from './mcp-prompt.command';

@Injectable()
export class McpBootstrap implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpBootstrap.name);
  // Track everything we registered so onModuleDestroy can clean up
  private readonly registeredToolNames: string[] = [];
  private readonly registeredCommandNames: string[] = [];

  constructor(
    private readonly tools: ToolRegistry,
    private readonly commands: CommandRegistry,
    private readonly mcp: McpRegistry,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    let mcpConfig: McpConfig;
    try {
      mcpConfig = loadMcpConfig(this.appConfig.workspaceRoot);
    } catch (e) {
      this.logger.error(`Failed to load MCP config: ${(e as Error).message}`);
      return;
    }

    const entries = Object.entries(mcpConfig.mcpServers).filter(([, c]) => !c.disabled);
    if (entries.length === 0) {
      this.logger.log('No MCP servers configured (.mcp.json absent or empty)');
      return;
    }
    this.logger.log(`Bootstrapping ${entries.length} MCP server(s)...`);

    // Connect in parallel — a slow remote shouldn't delay fast stdio servers
    await Promise.all(entries.map(([name, cfg]) => this.connectServer(name, cfg)));

    const connectedCount = this.mcp.connected().length;
    this.logger.log(
      `MCP bootstrap complete — ${connectedCount}/${entries.length} server(s) connected; ` +
        `${this.registeredToolNames.length} tool(s), ${this.registeredCommandNames.length} prompt-command(s)`,
    );
  }

  private async connectServer(name: string, cfg: McpConfig['mcpServers'][string]): Promise<void> {
    const client = new McpClient(name, cfg);
    this.mcp.add(client);
    try {
      await client.connect();
    } catch (e) {
      // State already set to 'failed' inside connect(); just log
      this.logger.error(`Server "${name}" failed: ${(e as Error).message}`);
      return;
    }

    // Tools
    try {
      const tools = await client.listTools();
      for (const info of tools) {
        const adapter = new McpToolAdapter(client, info);
        try {
          this.tools.register(adapter);
          this.registeredToolNames.push(adapter.name);
        } catch (e) {
          this.logger.warn(`Tool register conflict ${adapter.name}: ${(e as Error).message}`);
        }
      }
      this.logger.log(`"${name}": ${tools.length} tool(s) registered`);
    } catch (e) {
      this.logger.warn(`"${name}" listTools failed: ${(e as Error).message}`);
    }

    // Prompts → slash commands
    try {
      const prompts = await client.listPrompts();
      for (const info of prompts) {
        const cmd = new McpPromptCommand(client, info);
        this.commands.registerDynamic(cmd);
        this.registeredCommandNames.push(cmd.name);
      }
      if (prompts.length > 0) {
        this.logger.log(`"${name}": ${prompts.length} prompt(s) registered as slash commands`);
      }
    } catch (e) {
      this.logger.warn(`"${name}" listPrompts failed: ${(e as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const name of this.registeredToolNames) this.tools.unregister(name);
    for (const name of this.registeredCommandNames) this.commands.unregisterDynamic(name);
    await Promise.all(this.mcp.all().map((c) => c.close()));
    this.registeredToolNames.length = 0;
    this.registeredCommandNames.length = 0;
  }
}
