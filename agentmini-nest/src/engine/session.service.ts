// Session memory: in-memory cache with write-through persistence to JSONL.
//
// Design:
//   - In-RAM Map for fast access during an active session
//   - SessionStore writes every assistant/user/tool message to disk (debounced)
//   - getOrCreate first checks RAM; falls back to loading from disk; otherwise creates fresh
//   - TTL eviction drops idle sessions from RAM (disk is canonical)
//   - Compaction rewrites the on-disk transcript so resume sees the compacted view

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { APIMessage, UserContentPart } from '../common/types';
import { SessionStore } from '../services/storage/session-store.service';
import { MemoryService } from '../memory/memory.service';

const SYSTEM_PROMPT = `You are AgentMini — a fault-tolerant coding agent with file, shell, web, and todo tools.

Tools (PascalCase, mirroring Claude Code):
- Bash: run shell commands inside the workspace
- Read / Write / Edit / MultiEdit: file IO inside the workspace
- Glob / Grep / LS: search and list files
- WebSearch / WebFetch: get up-to-date info from the internet
- TodoWrite: maintain a structured task list across the conversation
- Sleep: pause briefly when polling for state

Slash commands (the user types these directly):
- /help, /clear, /compact, /cost, /model, /tools, /resume, /export

Rules:
- Prefer reading before editing. Use exact strings for Edit.
- Stay within the workspace; never read or write outside it.
- If a tool fails, read the error and try a different approach. Do not retry blindly.
- Be concise. Use tools instead of guessing.`;

interface Session {
  id: string;
  apiMessages: APIMessage[];
  cumulative: { inputTokens: number; outputTokens: number };
  createdAt: Date;
  lastActiveAt: Date;
  // True for sessions that have at least one user message persisted on disk.
  // We delay creating the on-disk file until the first real message so a
  // bare GET on a missing sessionId doesn't litter the sessions dir.
  persisted: boolean;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours in RAM
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(
    private readonly store: SessionStore,
    private readonly memory: MemoryService,
  ) {
    this.sweepTimer = setInterval(() => this.evictIdleFromRam(), SWEEP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
  }

  // Get or create a session. Resume from disk if it exists there but not in RAM.
  async getOrCreate(sessionId?: string): Promise<Session> {
    if (sessionId) {
      const cached = this.sessions.get(sessionId);
      if (cached) {
        cached.lastActiveAt = new Date();
        return cached;
      }
      // Try resume from disk
      if (await this.store.exists(sessionId)) {
        const loaded = await this.store.load(sessionId);
        if (loaded) {
          const session: Session = {
            id: sessionId,
            apiMessages:
              loaded.messages.length > 0 && loaded.messages[0]!.role === 'system'
                ? loaded.messages
                : [{ role: 'system', content: SYSTEM_PROMPT }, ...loaded.messages],
            cumulative: {
              inputTokens: loaded.meta.cumulativeInputTokens,
              outputTokens: loaded.meta.cumulativeOutputTokens,
            },
            createdAt: new Date(loaded.meta.createdAt),
            lastActiveAt: new Date(),
            persisted: true,
          };
          this.sessions.set(sessionId, session);
          this.logger.log(`Resumed session ${sessionId} from disk (${loaded.messages.length} messages)`);
          return session;
        }
      }
    }
    // Fresh session — bootstrap with memory index so the agent sees what it
    // already knows from prior sessions.
    const id = sessionId ?? randomUUID();
    const memoryIndex = await this.memory.readIndex();
    const memoryNote = memoryIndex.trim()
      ? `\n\n# Long-term memory (MEMORY.md)\nThe agent has the following persistent memories. Use RecallMemory to read individual entries.\n\n${memoryIndex.trim()}`
      : '';
    const session: Session = {
      id,
      apiMessages: [{ role: 'system', content: SYSTEM_PROMPT + memoryNote }],
      cumulative: { inputTokens: 0, outputTokens: 0 },
      createdAt: new Date(),
      lastActiveAt: new Date(),
      persisted: false,
    };
    this.sessions.set(id, session);
    return session;
  }

  // Append a user message to in-RAM history AND persist to disk.
  // Lazy-creates the on-disk file on first message.
  async appendUser(session: Session, content: string | UserContentPart[]): Promise<void> {
    const msg: APIMessage = { role: 'user', content };
    session.apiMessages.push(msg);
    await this.persistTurnStart(session);
    await this.store.appendMessage(session.id, msg);
  }

  // Persist a slice of newly-added messages (assistant + tool messages from the turn).
  // Called from the controller after the engine has finished a turn.
  async persistMessages(session: Session, fromIndex: number): Promise<void> {
    const slice = session.apiMessages.slice(fromIndex);
    for (const m of slice) {
      await this.store.appendMessage(session.id, m);
    }
    await this.persistMeta(session);
  }

  // Add the latest turn's token usage to the running totals + meta.
  async recordTurnUsage(session: Session, inputTokens: number, outputTokens: number): Promise<void> {
    session.cumulative.inputTokens += inputTokens;
    session.cumulative.outputTokens += outputTokens;
    await this.persistMeta(session);
  }

  // Called by the compaction service after it rewrites apiMessages in-place.
  async persistAfterCompaction(
    session: Session,
    stats: { before: number; after: number; freedTokens: number; manual: boolean },
  ): Promise<void> {
    if (!session.persisted) return;
    await this.store.rewriteAfterCompaction(session.id, session.apiMessages);
    await this.store.appendCompactMarker(session.id, stats);
    await this.persistMeta(session);
  }

  count(): number {
    return this.sessions.size;
  }

  async list(): Promise<Awaited<ReturnType<SessionStore['list']>>> {
    return this.store.list();
  }

  // /clear: drop history (keep system) in RAM and on disk.
  async reset(sessionId: string): Promise<{ sessionId: string; cleared: boolean }> {
    this.sessions.delete(sessionId);
    await this.store.delete(sessionId);
    return { sessionId, cleared: true };
  }

  // Evict idle sessions from RAM (disk copy is canonical, so a future request resumes them).
  private evictIdleFromRam(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, s] of this.sessions) {
      if (s.lastActiveAt.getTime() < cutoff) {
        this.sessions.delete(id);
      }
    }
  }

  private async persistTurnStart(session: Session): Promise<void> {
    if (!session.persisted) {
      await this.store.createIfMissing(session.id);
      // Also persist the system prompt as the first message for resume fidelity
      const sys = session.apiMessages[0];
      if (sys && sys.role === 'system') await this.store.appendMessage(session.id, sys);
      session.persisted = true;
    }
  }

  private async persistMeta(session: Session): Promise<void> {
    if (!session.persisted) return;
    await this.store.writeMeta(session.id, {
      sessionId: session.id,
      createdAt: session.createdAt.toISOString(),
      lastActiveAt: new Date().toISOString(),
      cumulativeInputTokens: session.cumulative.inputTokens,
      cumulativeOutputTokens: session.cumulative.outputTokens,
      messageCount: session.apiMessages.length,
    });
  }
}

export type { Session };
