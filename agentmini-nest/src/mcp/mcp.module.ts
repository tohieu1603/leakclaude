// MCP module — owns McpRegistry (singleton across the app) and McpBootstrap
// which discovers tools/prompts at startup and shuts everything down on
// destroy. McpRegistry is exported so the built-in ListMcpResources /
// ReadMcpResource tools can query it.

import { Module, forwardRef } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { CommandsModule } from '../services/commands/commands.module';
import { McpBootstrap } from './mcp-bootstrap.service';
import { McpRegistry } from './mcp-registry.service';

@Module({
  imports: [
    forwardRef(() => ToolsModule),
    forwardRef(() => CommandsModule),
  ],
  providers: [McpRegistry, McpBootstrap],
  exports: [McpRegistry, McpBootstrap],
})
export class McpModule {}
