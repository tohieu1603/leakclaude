// Async-local-storage-like single-value holder for the "current sessionId"
// during a tool call. The engine writes this before each turn so tools that
// don't have direct access to the controller (Plan mode, AskUserQuestion,
// Memory, Worktree) can still discover which session they belong to.
//
// Single-server design: this is a global ref, NOT per-request. That's fine
// because tool calls are awaited serially per session (we don't interleave
// turns for the same session). For now we accept the trade-off; if we ever
// support multi-tenant parallel turns we'll move to AsyncLocalStorage.

import { Injectable } from '@nestjs/common';

@Injectable()
export class ActiveSessionRef {
  private sessionId = 'anon';

  set(id: string): void {
    this.sessionId = id;
  }

  get(): string {
    return this.sessionId;
  }
}
