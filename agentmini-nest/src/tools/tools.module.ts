// Wire every tool under the TOOL multi-provider so ToolRegistry collects them.

import { Module, forwardRef } from '@nestjs/common';
import { TOOL } from './tool.interface';
import { ToolRegistry } from './tool-registry.service';
import { BashTool } from './BashTool/BashTool';
import { ReadTool } from './ReadTool/ReadTool';
import { WriteTool } from './WriteTool/WriteTool';
import { EditTool } from './EditTool/EditTool';
import { MultiEditTool } from './MultiEditTool/MultiEditTool';
import { GlobTool } from './GlobTool/GlobTool';
import { GrepTool } from './GrepTool/GrepTool';
import { LSTool } from './LSTool/LSTool';
import { WebFetchTool } from './WebFetchTool/WebFetchTool';
import { WebSearchTool } from './WebSearchTool/WebSearchTool';
import { TodoWriteTool } from './TodoWriteTool/TodoWriteTool';
import { TodoStore } from './TodoWriteTool/todo-store.service';
import { SleepTool } from './SleepTool/SleepTool';
import { ListMcpResourcesTool } from './ListMcpResourcesTool/ListMcpResourcesTool';
import { ReadMcpResourceTool } from './ReadMcpResourceTool/ReadMcpResourceTool';
import { McpModule } from '../mcp/mcp.module';
import { BashOutputTool } from './BashOutputTool/BashOutputTool';
import { KillShellTool } from './KillShellTool/KillShellTool';
import { MonitorTool } from './MonitorTool/MonitorTool';
import { BackgroundShellService } from './shared/background-shell.service';
import { EnterPlanModeTool } from './EnterPlanModeTool/EnterPlanModeTool';
import { ExitPlanModeTool } from './ExitPlanModeTool/ExitPlanModeTool';
import { AskUserQuestionTool } from './AskUserQuestionTool/AskUserQuestionTool';
import { ActiveSessionRef } from './shared/active-session-ref.service';
import { UserQuestionBus } from './shared/user-question-bus.service';
import { TaskTool } from './TaskTool/TaskTool';
import { AgentsModule } from '../agents/agents.module';
import { RememberTool } from './RememberTool/RememberTool';
import { RecallMemoryTool } from './RecallMemoryTool/RecallMemoryTool';
import { ForgetTool } from './ForgetTool/ForgetTool';
import { EnterWorktreeTool } from './EnterWorktreeTool/EnterWorktreeTool';
import { ExitWorktreeTool } from './ExitWorktreeTool/ExitWorktreeTool';
import { WorktreeRegistry } from './shared/worktree-registry.service';
import { CronCreateTool } from './CronCreateTool/CronCreateTool';
import { CronListTool } from './CronListTool/CronListTool';
import { CronDeleteTool } from './CronDeleteTool/CronDeleteTool';
import { NotebookEditTool } from './NotebookEditTool/NotebookEditTool';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { DynamicToolsBootstrap } from './dynamic-tools.bootstrap';

// STATIC_TOOLS are wired into the TOOL multi-provider at module construction.
// DYNAMIC_TOOLS are registered later by DynamicToolsBootstrap (see that file
// for why). The final agent-facing catalogue includes both.
const STATIC_TOOLS = [
  BashTool,
  ReadTool,
  WriteTool,
  EditTool,
  MultiEditTool,
  GlobTool,
  GrepTool,
  LSTool,
  WebFetchTool,
  WebSearchTool,
  TodoWriteTool,
  SleepTool,
  ListMcpResourcesTool,
  ReadMcpResourceTool,
  BashOutputTool,
  KillShellTool,
  MonitorTool,
  EnterPlanModeTool,
  ExitPlanModeTool,
  AskUserQuestionTool,
  RememberTool,
  RecallMemoryTool,
  ForgetTool,
  EnterWorktreeTool,
  ExitWorktreeTool,
  NotebookEditTool,
];

const DYNAMIC_TOOLS = [TaskTool, CronCreateTool, CronListTool, CronDeleteTool];

@Module({
  // forwardRef because McpModule imports ToolsModule to populate the ToolRegistry,
  // and ListMcpResourcesTool / ReadMcpResourceTool need McpRegistry from McpModule.
  // forwardRef on AgentsModule because Task tool depends on AgentRunner, which
  // depends on QueryService, which depends back on ToolsModule.
  imports: [
    forwardRef(() => McpModule),
    forwardRef(() => AgentsModule),
    forwardRef(() => SchedulerModule),
  ],
  providers: [
    ToolRegistry,
    TodoStore,
    BackgroundShellService,
    ActiveSessionRef,
    UserQuestionBus,
    WorktreeRegistry,
    DynamicToolsBootstrap,
    ...STATIC_TOOLS,
    ...DYNAMIC_TOOLS,
    {
      provide: TOOL,
      useFactory: (...tools) => tools,
      inject: STATIC_TOOLS,
    },
  ],
  exports: [ToolRegistry, TodoStore, ActiveSessionRef, UserQuestionBus, BackgroundShellService],
})
export class ToolsModule {}
