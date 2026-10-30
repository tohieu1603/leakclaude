// /tools — list registered tools (handy for debugging which tools the model sees).

import { Injectable } from '@nestjs/common';
import { ToolRegistry } from '../../../tools/tool-registry.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class ToolsCommand implements SlashCommand {
  readonly name = 'tools';
  readonly description = 'List registered tools and their concurrency-safety';

  constructor(private readonly tools: ToolRegistry) {}

  async call(_args: string, _ctx: CommandContext): Promise<CommandResult> {
    const lines = ['Registered tools:'];
    for (const name of this.tools.names()) {
      const safe = this.tools.isConcurrencySafe(name) ? 'parallel-safe' : 'sequential';
      lines.push(`  ${name.padEnd(12)}  ${safe}`);
    }
    return { type: 'text', value: lines.join('\n') };
  }
}
