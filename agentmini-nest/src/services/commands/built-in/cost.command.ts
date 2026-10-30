// /cost — show cumulative token usage for this session + estimated context use.

import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../../config/config.module';
import { estimateMessagesTokens } from '../../../common/token-estimator';
import { CompactionService } from '../../compaction/compaction.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class CostCommand implements SlashCommand {
  readonly name = 'cost';
  readonly description = 'Show cumulative token usage and context utilization';
  readonly aliases = ['usage'];

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly compactor: CompactionService,
  ) {}

  async call(_args: string, ctx: CommandContext): Promise<CommandResult> {
    const ctxTokens = estimateMessagesTokens(ctx.messages);
    const threshold = this.compactor.threshold();
    const pct = Math.round((ctxTokens / threshold) * 100);
    const lines = [
      `Model: ${this.config.ai.model}`,
      `Session: ${ctx.session.id}`,
      `Cumulative tokens: input=${ctx.cumulative.inputTokens}, output=${ctx.cumulative.outputTokens}`,
      `Context size: ~${ctxTokens} tokens (${pct}% of ${threshold} autocompact threshold)`,
      `Messages: ${ctx.messages.length}`,
    ];
    return { type: 'text', value: lines.join('\n') };
  }
}
