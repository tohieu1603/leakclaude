// /export — return the current session's full message transcript as JSON
// inside the SSE text stream so the client can save it.

import { Injectable } from '@nestjs/common';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class ExportCommand implements SlashCommand {
  readonly name = 'export';
  readonly description = 'Dump the current session transcript as JSON';

  async call(_args: string, ctx: CommandContext): Promise<CommandResult> {
    const exportObj = {
      sessionId: ctx.session.id,
      cumulative: ctx.cumulative,
      messageCount: ctx.messages.length,
      messages: ctx.messages,
    };
    return { type: 'text', value: JSON.stringify(exportObj, null, 2) };
  }
}
