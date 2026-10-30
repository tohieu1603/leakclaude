// /skill <name>  — inject skill body into the session as a system-reminder.
// /skills        — list catalogue.

import { Injectable } from '@nestjs/common';
import { SkillsService } from '../../../skills/skills.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

@Injectable()
export class SkillCommand implements SlashCommand {
  readonly name = 'skill';
  readonly description = 'Load a skill from the catalogue into this conversation';

  constructor(private readonly skills: SkillsService) {}

  async call(args: string, ctx: CommandContext): Promise<CommandResult> {
    const name = args.trim();
    if (!name) {
      return { type: 'text', value: 'Usage: /skill <name>\nRun /skills to list available skills.' };
    }
    const skill = this.skills.get(name);
    if (!skill) {
      return { type: 'text', value: `No skill named "${name}". Run /skills to list available.` };
    }
    ctx.messages.push({
      role: 'user',
      content: `<system-reminder source="skill:${skill.name}">${skill.body}</system-reminder>`,
    });
    return { type: 'text', value: `Loaded skill: ${skill.name} (${skill.body.length} chars)` };
  }
}

@Injectable()
export class SkillsCommand implements SlashCommand {
  readonly name = 'skills';
  readonly description = 'List available skills from the catalogue';

  constructor(private readonly skills: SkillsService) {}

  async call(): Promise<CommandResult> {
    const all = this.skills.list();
    if (all.length === 0) {
      return {
        type: 'text',
        value:
          'No skills available. Add markdown files under .agentmini/skills/ or ~/.agentmini-nest/skills/',
      };
    }
    const lines = all.map((s) => `  /skill ${s.name.padEnd(20)} ${s.description}`);
    return { type: 'text', value: `Available skills:\n${lines.join('\n')}` };
  }
}
