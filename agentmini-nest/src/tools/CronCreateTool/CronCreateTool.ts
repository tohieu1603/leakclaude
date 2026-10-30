import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok, err } from '../tool.interface';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { CRON_CREATE_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({
  name: z.string().min(1).max(80),
  prompt: z.string().min(10),
  intervalSeconds: z.number().int().min(0),
  startAt: z.string().datetime().optional(),
});

@Injectable()
export class CronCreateTool implements Tool<typeof inputSchema> {
  readonly name = CRON_CREATE_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;

  constructor(
    @Inject(forwardRef(() => SchedulerService)) private readonly scheduler: SchedulerService,
  ) {}

  async call(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    try {
      const job = await this.scheduler.create(input);
      return ok(
        `Scheduled cron ${job.id} (${job.name})\n` +
          `  Next fire: ${job.nextRunAt}\n` +
          `  Interval:  ${job.intervalSeconds === 0 ? 'one-shot' : `${job.intervalSeconds}s`}`,
      );
    } catch (e) {
      return err(`Failed to create cron: ${(e as Error).message}`);
    }
  }
}
