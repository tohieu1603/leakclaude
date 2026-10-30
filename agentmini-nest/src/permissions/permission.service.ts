// Permission modes modeled on Claude Code:
//   default          – ask for write/destructive tools, allow read-only
//   acceptEdits      – auto-allow write/edit tools, still ask for Bash
//   plan             – read-only mode (write/edit/Bash all denied); only
//                      ExitPlanMode can leave this mode
//   bypassPermissions– allow everything (dangerous, opt-in only)
//
// Mode is per-session and lives in RAM. Changing the mode is a side-effect of
// either the /permissions slash command or the EnterPlanMode/ExitPlanMode
// tools. The engine consults canUseTool() before every tool execution; the
// chat controller exposes /permissions <mode> so users can switch.

import { Injectable, Logger } from '@nestjs/common';

export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';

// Tools that mutate filesystem / process state.
const WRITE_TOOLS = new Set([
  'Write',
  'Edit',
  'MultiEdit',
  'NotebookEdit',
]);
const DESTRUCTIVE_TOOLS = new Set([
  'Bash',
]);

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
  // If allowed but flagged, callers should surface a confirmation event.
  needsConfirmation?: boolean;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly modes = new Map<string, PermissionMode>();
  // sessionId → set of toolName entries pre-approved for this session
  private readonly approvals = new Map<string, Set<string>>();

  getMode(sessionId: string): PermissionMode {
    return this.modes.get(sessionId) ?? 'default';
  }

  setMode(sessionId: string, mode: PermissionMode): void {
    this.modes.set(sessionId, mode);
    this.logger.log(`Session ${sessionId} → permission mode ${mode}`);
  }

  approve(sessionId: string, toolName: string): void {
    let set = this.approvals.get(sessionId);
    if (!set) { set = new Set(); this.approvals.set(sessionId, set); }
    set.add(toolName);
  }

  canUseTool(sessionId: string, toolName: string): PermissionDecision {
    const mode = this.getMode(sessionId);
    const isWrite = WRITE_TOOLS.has(toolName);
    const isDestructive = DESTRUCTIVE_TOOLS.has(toolName);
    const approved = this.approvals.get(sessionId)?.has(toolName) ?? false;

    if (mode === 'bypassPermissions') return { allowed: true };
    if (mode === 'plan') {
      if (toolName === 'ExitPlanMode') return { allowed: true };
      if (isWrite || isDestructive) {
        return {
          allowed: false,
          reason:
            `Permission mode "plan" forbids ${toolName}. Use ExitPlanMode to leave plan mode before writing or running shell commands.`,
        };
      }
      return { allowed: true };
    }
    if (mode === 'acceptEdits') {
      if (isWrite) return { allowed: true };
      if (isDestructive && !approved) {
        return { allowed: true, needsConfirmation: true };
      }
      return { allowed: true };
    }
    // default mode
    if (isWrite || isDestructive) {
      if (approved) return { allowed: true };
      return { allowed: true, needsConfirmation: true };
    }
    return { allowed: true };
  }
}
