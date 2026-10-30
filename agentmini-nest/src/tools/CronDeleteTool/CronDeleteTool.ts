import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { CRON_DELETE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({ id: z.string().min(1) });

@Injectable()
export class CronDeleteTool implements Tool<typeof inputSchema> {
  readonly name = CRON_DELETE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(
    @Inject(forwardRef(() => SchedulerService)) private readonly scheduler: SchedulerService,
  ) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const removed = await this.scheduler.remove(input.id);
    if (!removed) return err(`No cron job with id "${input.id}"`);
    return ok(`Deleted cron ${input.id}`);
  }
}
