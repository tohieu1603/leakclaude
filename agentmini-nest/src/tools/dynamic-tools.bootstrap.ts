// Some tools depend on services that themselves depend on QueryService
// (Task → AgentRunner → QueryService) or that close the loop through the
// ToolsModule itself (Cron* → SchedulerService → AgentRunner → ToolsModule).
//
// Putting these in the static TOOL multi-provider produces `undefined`
// entries because Nest cannot fully resolve them at TOOL-multi-provider
// construction time (forwardRef yields undefined in inject arrays).
//
// Instead we register them dynamically at onModuleInit, after every module
// is fully wired — exactly how McpBootstrap registers MCP tools. The user
// sees the same final tool catalogue, the engine just learns about them
// one tick later than the static set.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ToolRegistry } from './tool-registry.service';
import { TaskTool } from './TaskTool/TaskTool';
import { CronCreateTool } from './CronCreateTool/CronCreateTool';
import { CronListTool } from './CronListTool/CronListTool';
import { CronDeleteTool } from './CronDeleteTool/CronDeleteTool';

@Injectable()
export class DynamicToolsBootstrap implements OnModuleInit {
  private readonly logger = new Logger(DynamicToolsBootstrap.name);

  constructor(
    private readonly registry: ToolRegistry,
    private readonly task: TaskTool,
    private readonly cronCreate: CronCreateTool,
    private readonly cronList: CronListTool,
    private readonly cronDelete: CronDeleteTool,
  ) {}

  onModuleInit(): void {
    const tools = [this.task, this.cronCreate, this.cronList, this.cronDelete];
    for (const t of tools) {
      try {
        this.registry.register(t);
      } catch (e) {
        this.logger.warn(`Cannot register ${t.name}: ${(e as Error).message}`);
      }
    }
  }
}
