// /compact [optional instructions] — manually trigger compaction.
// Mirrors Claude Code's /compact: passes user-supplied instructions through
// to the summarization model.

import { Injectable } from '@nestjs/common';
import { CompactionService } from '../../compaction/compaction.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class CompactCommand implements SlashCommand {
  readonly name = 'compact';
  readonly description = 'Summarize older messages to free context tokens';

  constructor(private readonly compactor: CompactionService) {}

  async call(args: string, ctx: CommandContext): Promise<CommandResult> {
    this.compactor.microCompact(ctx.messages); // cheap pre-pass
    const result = await this.compactor.compact(ctx.messages, {
      manual: true,
      instructions: args.trim() || undefined,
    });
    return {
      type: 'compact',
      before: result.stats.before,
      after: result.stats.after,
      freedTokens: result.stats.freedTokens,
      summaryText: 'Conversation compacted.',
    };
  }
}
