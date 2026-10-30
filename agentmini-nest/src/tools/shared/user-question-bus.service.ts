// Bridge between the agent and the human user for mid-turn questions.
//
// Tool flow (AskUserQuestion):
//   1. The tool calls `ask(sessionId, question)` which yields an SSE event
//      and a Promise resolved when the user answers.
//   2. The chat controller emits `ask_user` events to the client.
//   3. The client POSTs to /api/chat/answer with the answer; the controller
//      calls `answer(...)` which resolves the pending Promise.
//
// If the question times out (default 5min) we resolve with `null` and the tool
// returns a "no answer given" result so the agent can decide what to do next.

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface QuestionOption { label: string; description?: string }
export interface UserQuestion {
  id: string;
  sessionId: string;
  question: string;
  options: QuestionOption[];
  multiSelect: boolean;
  createdAt: number;
}
export interface QuestionEmitter {
  emit(q: UserQuestion): void;
}

interface Pending {
  q: UserQuestion;
  resolve: (answer: string[] | null) => void;
  timer: NodeJS.Timeout;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class UserQuestionBus {
  private readonly pending = new Map<string, Pending>();
  // Per-session emitter (chat controller registers a callback for the lifetime
  // of an SSE response, then deregisters on close).
  private readonly emitters = new Map<string, QuestionEmitter>();

  registerEmitter(sessionId: string, e: QuestionEmitter): () => void {
    this.emitters.set(sessionId, e);
    return () => {
      if (this.emitters.get(sessionId) === e) this.emitters.delete(sessionId);
    };
  }

  ask(
    sessionId: string,
    question: string,
    options: QuestionOption[],
    multiSelect = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): { id: string; promise: Promise<string[] | null> } {
    const id = `q_${randomUUID().slice(0, 8)}`;
    const q: UserQuestion = { id, sessionId, question, options, multiSelect, createdAt: Date.now() };
    const promise = new Promise<string[] | null>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve(null);
      }, timeoutMs);
      this.pending.set(id, { q, resolve, timer });
    });
    const emitter = this.emitters.get(sessionId);
    if (emitter) emitter.emit(q);
    return { id, promise };
  }

  answer(id: string, choices: string[]): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.pending.delete(id);
    entry.resolve(choices);
    return true;
  }

  listOpen(sessionId: string): UserQuestion[] {
    return Array.from(this.pending.values())
      .filter((p) => p.q.sessionId === sessionId)
      .map((p) => p.q);
  }
}
