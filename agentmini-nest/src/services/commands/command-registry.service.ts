// Collects every slash command registered under SLASH_COMMAND and dispatches
// `/cmd args` from the controller. Mirrors Claude Code's pattern of resolving
// by name + aliases.

import { Inject, Injectable, Logger } from '@nestjs/common';
import { SLASH_COMMAND, type SlashCommand, type CommandContext, type CommandResult } from './command.interface';

@Injectable()
export class CommandRegistry {
  private readonly logger = new Logger(CommandRegistry.name);
  private readonly byName = new Map<string, SlashCommand>();

  constructor(@Inject(SLASH_COMMAND) cmds: SlashCommand[]) {
    for (const cmd of cmds) {
      this.byName.set(cmd.name, cmd);
      for (const alias of cmd.aliases ?? []) this.byName.set(alias, cmd);
    }
    this.logger.log(`Registered ${cmds.length} slash commands: ${cmds.map((c) => `/${c.name}`).join(', ')}`);
  }

  // Returns null if the input isn't a slash command; otherwise parsed name + args.
  static parse(input: string): { name: string; args: string } | null {
    if (!input.startsWith('/')) return null;
    const trimmed = input.slice(1).trim();
    if (!trimmed) return null;
    const space = trimmed.indexOf(' ');
    if (space === -1) return { name: trimmed, args: '' };
    return { name: trimmed.slice(0, space), args: trimmed.slice(space + 1).trim() };
  }

  list(): SlashCommand[] {
    // Deduplicate (aliases share the same instance)
    return Array.from(new Set(this.byName.values()));
  }

  // Dynamic registration (used by McpBootstrap to expose MCP prompts as
  // slash commands at runtime). Refuses to overwrite an existing command.
  registerDynamic(cmd: SlashCommand): void {
    if (this.byName.has(cmd.name)) {
      throw new Error(`Refusing to register dynamic command "/${cmd.name}": already exists`);
    }
    this.byName.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      if (!this.byName.has(alias)) this.byName.set(alias, cmd);
    }
    this.logger.log(`Dynamically registered command: /${cmd.name}`);
  }

  unregisterDynamic(name: string): void {
    const cmd = this.byName.get(name);
    if (!cmd) return;
    this.byName.delete(name);
    for (const alias of cmd.aliases ?? []) {
      if (this.byName.get(alias) === cmd) this.byName.delete(alias);
    }
    this.logger.log(`Unregistered dynamic command: /${name}`);
  }

  async dispatch(name: string, args: string, ctx: CommandContext): Promise<CommandResult> {
    const cmd = this.byName.get(name);
    if (!cmd) {
      return { type: 'text', value: `Unknown command: /${name}. Type /help to see available commands.` };
    }
    return cmd.call(args, ctx);
  }
}
