// Slash-command abstraction modeled on Claude Code's LocalCommand:
// each command is a class that returns either text (echoed back to user) or
// a 'compact' result (history was rewritten — controller should signal this).

import type { APIMessage } from '../../common/types';
import type { Session } from '../../engine/session.service';

export type CommandResult =
  | { type: 'text'; value: string }
  | { type: 'compact'; before: number; after: number; freedTokens: number; summaryText: string }
  | { type: 'cleared'; sessionId: string };

export interface CommandContext {
  session: Session;
  // The whole apiMessages array, mutable. Compaction mutates it in place.
  messages: APIMessage[];
  // Cumulative token usage observed for this session
  cumulative: { inputTokens: number; outputTokens: number };
}

export interface SlashCommand {
  // /name as the user types it (without the leading slash)
  readonly name: string;
  // Short description (used by /help)
  readonly description: string;
  // Optional aliases (e.g. ['reset', 'new'] for /clear)
  readonly aliases?: readonly string[];

  call(args: string, ctx: CommandContext): Promise<CommandResult>;
}

export const SLASH_COMMAND = Symbol('SLASH_COMMAND');
