// /resume — list saved sessions on disk so the user can pick one to continue.
// (Actual switching happens client-side: the user POSTs to /api/chat with the
// chosen sessionId, and SessionService.getOrCreate lazy-loads it.)

import { Injectable } from '@nestjs/common';
import { SessionService } from '../../../engine/session.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class ResumeCommand implements SlashCommand {
  readonly name = 'resume';
  readonly description = 'List saved sessions you can resume';

  constructor(private readonly sessions: SessionService) {}

  async call(_args: string, _ctx: CommandContext): Promise<CommandResult> {
    const list = await this.sessions.list();
    if (list.length === 0) {
      return { type: 'text', value: 'No saved sessions on disk. Start a conversation to create one.' };
    }
    const lines = ['Saved sessions (newest first):'];
    for (const s of list.slice(0, 30)) {
      lines.push(
        `  ${s.sessionId}  msgs=${s.messageCount}  in=${s.cumulativeInputTokens} out=${s.cumulativeOutputTokens}  active=${s.lastActiveAt}`,
      );
    }
    lines.push('');
    lines.push('To resume, POST /api/chat with sessionId set to the chosen ID.');
    return { type: 'text', value: lines.join('\n') };
  }
}
