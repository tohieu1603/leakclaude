import { Module, forwardRef } from '@nestjs/common';
import { ToolsModule } from '../../tools/tools.module';
import { CompactionModule } from '../compaction/compaction.module';
import { EngineModule } from '../../engine/engine.module';
import { McpModule } from '../../mcp/mcp.module';
import { CommandRegistry } from './command-registry.service';
import { SLASH_COMMAND } from './command.interface';
import { HelpCommand } from './built-in/help.command';
import { ClearCommand } from './built-in/clear.command';
import { CompactCommand } from './built-in/compact.command';
import { CostCommand } from './built-in/cost.command';
import { ModelCommand } from './built-in/model.command';
import { ToolsCommand } from './built-in/tools.command';
import { ResumeCommand } from './built-in/resume.command';
import { ExportCommand } from './built-in/export.command';
import { McpCommand } from './built-in/mcp.command';
import { PermissionsCommand } from './built-in/permissions.command';
import { SkillCommand, SkillsCommand } from './built-in/skill.command';
import { CustomCommandLoader } from './custom-command-loader.service';
import { CustomCommandsBootstrap } from './custom-commands.bootstrap';

const COMMANDS = [
  HelpCommand,
  ClearCommand,
  CompactCommand,
  CostCommand,
  ModelCommand,
  ToolsCommand,
  ResumeCommand,
  ExportCommand,
  McpCommand,
  PermissionsCommand,
  SkillCommand,
  SkillsCommand,
];

@Module({
  // forwardRef on EngineModule because ChatModule imports CommandsModule
  // *and* EngineModule, while ResumeCommand depends on SessionService (Engine).
  // forwardRef on McpModule because McpModule imports CommandsModule
  // (to register MCP prompts as dynamic commands at boot).
  imports: [
    forwardRef(() => ToolsModule),
    CompactionModule,
    forwardRef(() => EngineModule),
    forwardRef(() => McpModule),
  ],
  providers: [
    CommandRegistry,
    CustomCommandLoader,
    CustomCommandsBootstrap,
    ...COMMANDS,
    {
      provide: SLASH_COMMAND,
      useFactory: (...cmds) => cmds,
      inject: COMMANDS,
    },
  ],
  exports: [CommandRegistry],
})
export class CommandsModule {}
