// /help — list registered commands.
// Uses ModuleRef to break the circular dep with CommandRegistry
// (HelpCommand → CommandRegistry → injected SLASH_COMMAND[] → HelpCommand).

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandRegistry } from '../command-registry.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class HelpCommand implements SlashCommand {
  readonly name = 'help';
  readonly description = 'List available slash commands';
  readonly aliases = ['?'];

  constructor(private readonly moduleRef: ModuleRef) {}

  async call(_args: string, _ctx: CommandContext): Promise<CommandResult> {
    // Resolve at call time — registry exists by then but resolving it via
    // constructor injection would close the DI cycle.
    const registry = this.moduleRef.get(CommandRegistry, { strict: false });
    const lines = ['Available commands:'];
    for (const cmd of registry.list()) {
      const aliases = cmd.aliases?.length ? ` (aliases: ${cmd.aliases.map((a) => '/' + a).join(', ')})` : '';
      lines.push(`  /${cmd.name} — ${cmd.description}${aliases}`);
    }
    return { type: 'text', value: lines.join('\n') };
  }
}
