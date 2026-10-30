import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolResult, ok } from '../tool.interface';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { CRON_LIST_TOOL_NAME, PROMPT } from './prompt';

const inputSchema = z.strictObject({});

@Injectable()
export class CronListTool implements Tool<typeof inputSchema> {
  readonly name = CRON_LIST_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly concurrencySafe = true;

  constructor(
    @Inject(forwardRef(() => SchedulerService)) private readonly scheduler: SchedulerService,
  ) {}

  async call(): Promise<ToolResult> {
    const jobs = this.scheduler.list();
    if (jobs.length === 0) return ok('(no scheduled cron jobs)');
    const lines = jobs.map((j) =>
      `  ${j.id} [${j.enabled ? 'on ' : 'off'}] every ${j.intervalSeconds === 0 ? 'one-shot' : `${j.intervalSeconds}s`} ` +
        `next=${j.nextRunAt} name=${j.name}`,
    );
    return ok(`Cron jobs (${jobs.length}):\n${lines.join('\n')}`);
  }
}
