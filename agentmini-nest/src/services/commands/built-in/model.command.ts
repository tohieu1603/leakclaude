// /model — report the active model. Read-only in this mini server (model is env-driven).

import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../../config/config.module';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class ModelCommand implements SlashCommand {
  readonly name = 'model';
  readonly description = 'Show the active model';

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async call(_args: string, _ctx: CommandContext): Promise<CommandResult> {
    return {
      type: 'text',
      value: `Active model: ${this.config.ai.model}\nBase URL: ${this.config.ai.baseUrl}\n(Set AI_MODEL in .env to change. Hot-swap is intentionally not implemented in mini.)`,
    };
  }
}
