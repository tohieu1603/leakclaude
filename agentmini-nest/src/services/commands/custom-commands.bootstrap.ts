// Loads user-defined markdown slash commands at startup and registers them
// on the CommandRegistry. Mirrors McpBootstrap's pattern: keeps the side-effect
// out of CommandsModule itself so dynamic registration stays explicit.

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { CommandRegistry } from './command-registry.service';
import { CustomCommandLoader } from './custom-command-loader.service';

@Injectable()
export class CustomCommandsBootstrap implements OnModuleInit {
  private readonly logger = new Logger(CustomCommandsBootstrap.name);

  constructor(
    private readonly registry: CommandRegistry,
    private readonly loader: CustomCommandLoader,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    const cmds = await this.loader.loadAll(this.config.workspaceRoot);
    for (const cmd of cmds) {
      try {
        this.registry.registerDynamic(cmd);
      } catch (e) {
        this.logger.warn(`Cannot register /${cmd.name}: ${(e as Error).message}`);
      }
    }
  }
}
