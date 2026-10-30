// AgentRunner lives in its own module to avoid circular deps: TaskTool
// (in ToolsModule) depends on AgentRunner, which depends on QueryService
// (in EngineModule), which already depends on ToolsModule.
//
// We break the cycle by NOT importing ToolsModule here — AgentRunner only
// touches QueryService (engine), not the tool registry directly. AgentsModule
// is imported from ToolsModule via forwardRef.

import { Module, forwardRef } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { AgentRunner } from './agent-runner.service';

@Module({
  imports: [forwardRef(() => EngineModule)],
  providers: [AgentRunner],
  exports: [AgentRunner],
})
export class AgentsModule {}
