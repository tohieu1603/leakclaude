// /permissions [<mode>]
// Shows current permission mode for this session, or switches to the given mode.
// Valid modes: default, acceptEdits, plan, bypassPermissions.

import { Injectable } from '@nestjs/common';
import { PermissionService, type PermissionMode } from '../../../permissions/permission.service';
import type { CommandContext, CommandResult, SlashCommand } from '../command.interface';

const VALID: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypassPermissions'];

@Injectable()
export class PermissionsCommand implements SlashCommand {
  readonly name = 'permissions';
  readonly description = 'Show or change the permission mode for this session';
  readonly aliases = ['mode'];

  constructor(private readonly permissions: PermissionService) {}

  async call(args: string, ctx: CommandContext): Promise<CommandResult> {
    const arg = args.trim();
    if (!arg) {
      return {
        type: 'text',
        value:
          `Permission mode (session ${ctx.session.id}): ${this.permissions.getMode(ctx.session.id)}\n` +
          `Modes: ${VALID.join(' | ')}\n` +
          `Usage: /permissions <mode>`,
      };
    }
    if (!VALID.includes(arg as PermissionMode)) {
      return { type: 'text', value: `Invalid mode "${arg}". Valid: ${VALID.join(', ')}` };
    }
    this.permissions.setMode(ctx.session.id, arg as PermissionMode);
    return { type: 'text', value: `Permission mode → ${arg}` };
  }
}
