// /clear — wipe conversation history (keep system prompt). Aliased /reset, /new.
// Mirrors Claude Code's clearConversation behavior at the message level.

import { Injectable } from '@nestjs/common';
import { TodoStore } from '../../../tools/TodoWriteTool/todo-store.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class ClearCommand implements SlashCommand {
  readonly name = 'clear';
  readonly description = 'Clear conversation history and free up context';
  readonly aliases = ['reset', 'new'];

  constructor(private readonly todos: TodoStore) {}

  async call(_args: string, ctx: CommandContext): Promise<CommandResult> {
    const system = ctx.messages.find((m) => m.role === 'system');
    ctx.messages.length = 0;
    if (system) ctx.messages.push(system);
    ctx.cumulative.inputTokens = 0;
    ctx.cumulative.outputTokens = 0;
    this.todos.clearSession(ctx.session.id);
    return { type: 'cleared', sessionId: ctx.session.id };
  }
}
