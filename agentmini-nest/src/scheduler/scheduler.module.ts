// SchedulerService depends on AgentRunner (which depends on QueryService).
// We use forwardRef on AgentsModule to break a potential cycle if AgentsModule
// were ever to import SchedulerModule. SchedulerModule itself is global so the
// scheduler tools can inject it directly.

import { Global, Module, forwardRef } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { SchedulerService } from './scheduler.service';

@Global()
@Module({
  imports: [forwardRef(() => AgentsModule)],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
