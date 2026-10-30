// Session-scoped todo store. The chat controller sets the active session before
// each turn so this tool knows which list to write to.

import { Injectable } from '@nestjs/common';

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
  content: string;
  activeForm: string;
  status: TodoStatus;
}

@Injectable()
export class TodoStore {
  private readonly bySession = new Map<string, TodoItem[]>();
  private active: string | null = null;

  setActiveSession(id: string): void {
    this.active = id;
  }

  getActiveSession(): string | null {
    return this.active;
  }

  getTodos(sessionId: string): TodoItem[] {
    return this.bySession.get(sessionId) ?? [];
  }

  setTodos(sessionId: string, todos: TodoItem[]): void {
    this.bySession.set(sessionId, todos);
  }

  clearSession(sessionId: string): void {
    this.bySession.delete(sessionId);
  }
}
