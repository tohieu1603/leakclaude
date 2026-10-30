import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok } from '../tool.interface';
import { PermissionService } from '../../permissions/permission.service';
import { ActiveSessionRef } from '../shared/active-session-ref.service';
import { EXIT_PLAN_MODE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  plan: z.string().min(1).describe('Final plan text. Echoed back to the user; helps audit what was approved.'),
});

@Injectable()
export class ExitPlanModeTool implements Tool<typeof inputSchema> {
  readonly name = EXIT_PLAN_MODE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(
    private readonly permissions: PermissionService,
    private readonly activeSession: ActiveSessionRef,
  ) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const sid = this.activeSession.get();
    this.permissions.setMode(sid, 'default');
    return ok(`Exited plan mode. The following plan is now ready to execute:\n\n${input.plan}`);
  }
}
