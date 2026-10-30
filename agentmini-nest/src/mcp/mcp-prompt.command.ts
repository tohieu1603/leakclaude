// MCP prompts → slash commands.
//
// When an MCP server advertises prompts via the `prompts` capability, each
// prompt becomes a slash command named "/mcp-<server>-<prompt>". Calling the
// command fetches the prompt body from the MCP server and emits it as text
// (the user can then paste / reuse it). The argument string passed after the
// slash is split into the prompt's declared arguments by name=value pairs,
// matching how Claude Code routes /mcp__... commands.

import type { SlashCommand, CommandContext, CommandResult } from '../services/commands/command.interface';
import type { McpClient, McpPromptInfo } from './mcp-client.service';
import { normalizeMcpName } from './name-utils';

export class McpPromptCommand implements SlashCommand {
  readonly name: string;
  readonly description: string;

  constructor(
    private readonly client: McpClient,
    private readonly info: McpPromptInfo,
  ) {
    this.name = `mcp-${normalizeMcpName(client.serverName)}-${normalizeMcpName(info.name)}`;
    const argList = (info.arguments ?? [])
      .map((a) => (a.required ? `${a.name}` : `[${a.name}]`))
      .join(' ');
    this.description = `[MCP/${client.serverName}] ${info.description ?? info.name}${
      argList ? ` — args: ${argList}` : ''
    }`;
  }

  async call(args: string, _ctx: CommandContext): Promise<CommandResult> {
    // Parse "key=value key2=value2" — simple, matches typical MCP prompt args
    const parsed: Record<string, string> = {};
    for (const token of args.match(/(\w+)=("[^"]*"|\S+)/g) ?? []) {
      const eq = token.indexOf('=');
      const key = token.slice(0, eq);
      let value = token.slice(eq + 1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      parsed[key] = value;
    }
    try {
      const body = await this.client.getPrompt(this.info.name, parsed);
      return { type: 'text', value: body };
    } catch (e) {
      return { type: 'text', value: `Prompt "${this.info.name}" failed: ${(e as Error).message}` };
    }
  }
}
