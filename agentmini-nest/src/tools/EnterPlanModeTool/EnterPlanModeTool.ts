// Tools cannot know the current sessionId directly, so we read it from a
// service-local "active session" that the engine sets per turn. Plan mode is
// per-session: switching a session into plan mode does not affect siblings.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok } from '../tool.interface';
import { PermissionService } from '../../permissions/permission.service';
import { ActiveSessionRef } from '../shared/active-session-ref.service';
import { ENTER_PLAN_MODE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({}).describe('No arguments — call with {}');

@Injectable()
export class EnterPlanModeTool implements Tool<typeof inputSchema> {
  readonly name = ENTER_PLAN_MODE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(
    private readonly permissions: PermissionService,
    private readonly activeSession: ActiveSessionRef,
  ) {}

  async call(): Promise<ToolResult> {
    const sid = this.activeSession.get();
    this.permissions.setMode(sid, 'plan');
    return ok(
      `Entered plan mode. Write/edit/shell tools are now blocked. Call ExitPlanMode when ready to apply changes.`,
    );
  }
}
