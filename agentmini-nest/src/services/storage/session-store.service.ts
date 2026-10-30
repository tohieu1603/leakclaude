// Session persistence — JSONL per session, modeled on Claude Code's
// utils/sessionStorage.ts (simplified for mini).
//
// Layout (under ~/.agentmini-nest/sessions/ by default; override with SESSIONS_DIR env):
//   <sessionId>.jsonl    one JSON object per line
//   <sessionId>.meta.json sidecar with createdAt/cumulative tokens
//
// Each JSONL line is one of:
//   { type: 'header', version: 1, sessionId, createdAt }
//   { type: 'message', message: APIMessage, recordedAt }
//   { type: 'compact', stats, recordedAt }    // marker for compaction events
//
// Writes are debounced (FLUSH_MS=100) to avoid one-fsync-per-turn cost while
// still being durable to most crashes. Reads happen lazily on first access.

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { readFile, readdir, stat, writeFile, appendFile, unlink } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import type { APIMessage } from '../../common/types';

const FLUSH_MS = 100;
const VERSION = 1;
const HEADER_TYPE = 'header' as const;
const MESSAGE_TYPE = 'message' as const;
const COMPACT_TYPE = 'compact' as const;

export interface SessionMeta {
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
  cumulativeInputTokens: number;
  cumulativeOutputTokens: number;
  messageCount: number;
}

export interface SessionLoad {
  meta: SessionMeta;
  messages: APIMessage[];
}

interface PendingWrite {
  filePath: string;
  line: string;
  resolve: () => void;
}

@Injectable()
export class SessionStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionStore.name);
  private readonly dir: string;
  private readonly queue: PendingWrite[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;

  constructor(@Inject(APP_CONFIG) _config: AppConfig) {
    this.dir = process.env.SESSIONS_DIR ?? join(homedir(), '.agentmini-nest', 'sessions');
  }

  onModuleInit(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
      this.logger.log(`Created sessions dir: ${this.dir}`);
    } else {
      this.logger.log(`Using sessions dir: ${this.dir}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Drain pending writes before shutdown
    if (this.flushTimer) clearTimeout(this.flushTimer);
    await this.drain();
  }

  // Path helpers — single source of truth for filesystem layout
  private jsonlPath(sessionId: string): string {
    return join(this.dir, `${sessionId}.jsonl`);
  }
  private metaPath(sessionId: string): string {
    return join(this.dir, `${sessionId}.meta.json`);
  }

  // True if a persisted session exists on disk for this id.
  async exists(sessionId: string): Promise<boolean> {
    try {
      await stat(this.jsonlPath(sessionId));
      return true;
    } catch {
      return false;
    }
  }

  // Append a header line if the file doesn't exist yet (idempotent — checked
  // by exists()). Writes meta.json synchronously so resume immediately sees
  // accurate stats.
  async createIfMissing(sessionId: string): Promise<void> {
    if (await this.exists(sessionId)) return;
    const header = JSON.stringify({
      type: HEADER_TYPE,
      version: VERSION,
      sessionId,
      createdAt: new Date().toISOString(),
    });
    await appendFile(this.jsonlPath(sessionId), header + '\n', 'utf8');
    await this.writeMeta(sessionId, {
      sessionId,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      cumulativeInputTokens: 0,
      cumulativeOutputTokens: 0,
      messageCount: 0,
    });
  }

  // Append a single message to the JSONL. Debounced — caller doesn't await fsync.
  appendMessage(sessionId: string, message: APIMessage): Promise<void> {
    const line = JSON.stringify({
      type: MESSAGE_TYPE,
      message,
      recordedAt: new Date().toISOString(),
    });
    return this.enqueue(this.jsonlPath(sessionId), line);
  }

  // Append a compaction marker so resume can render "history was compacted here".
  appendCompactMarker(
    sessionId: string,
    stats: { before: number; after: number; freedTokens: number; manual: boolean },
  ): Promise<void> {
    const line = JSON.stringify({
      type: COMPACT_TYPE,
      stats,
      recordedAt: new Date().toISOString(),
    });
    return this.enqueue(this.jsonlPath(sessionId), line);
  }

  // Replace the on-disk transcript after compaction. Does NOT overwrite the
  // header. We rewrite the file from scratch with the post-compaction message
  // set so resume reads the same view the engine sees.
  async rewriteAfterCompaction(sessionId: string, newMessages: APIMessage[]): Promise<void> {
    await this.drain(); // make sure no buffered appends race with the rewrite
    const lines: string[] = [
      JSON.stringify({
        type: HEADER_TYPE,
        version: VERSION,
        sessionId,
        createdAt: (await this.readMeta(sessionId))?.createdAt ?? new Date().toISOString(),
      }),
      ...newMessages.map((m) =>
        JSON.stringify({ type: MESSAGE_TYPE, message: m, recordedAt: new Date().toISOString() }),
      ),
    ];
    await writeFile(this.jsonlPath(sessionId), lines.join('\n') + '\n', 'utf8');
  }

  // Load full transcript from disk. Returns null if the session doesn't exist.
  async load(sessionId: string): Promise<SessionLoad | null> {
    if (!(await this.exists(sessionId))) return null;
    await this.drain(); // serialize against any in-flight appends to this file
    const raw = await readFile(this.jsonlPath(sessionId), 'utf8');
    const messages: APIMessage[] = [];
    let createdAt = new Date().toISOString();
    for (const rawLine of raw.split('\n')) {
      if (!rawLine.trim()) continue;
      try {
        const obj = JSON.parse(rawLine) as { type?: string };
        if (obj.type === HEADER_TYPE) {
          createdAt = (obj as { createdAt?: string }).createdAt ?? createdAt;
        } else if (obj.type === MESSAGE_TYPE) {
          messages.push((obj as { message: APIMessage }).message);
        }
        // 'compact' markers are advisory — we don't replay them on load
      } catch {
        // Skip corrupted lines rather than failing the whole load
      }
    }
    const meta = (await this.readMeta(sessionId)) ?? {
      sessionId,
      createdAt,
      lastActiveAt: new Date().toISOString(),
      cumulativeInputTokens: 0,
      cumulativeOutputTokens: 0,
      messageCount: messages.length,
    };
    return { meta, messages };
  }

  async list(): Promise<SessionMeta[]> {
    let entries: string[] = [];
    try {
      entries = await readdir(this.dir);
    } catch {
      return [];
    }
    const ids = entries.filter((f) => f.endsWith('.meta.json')).map((f) => f.replace('.meta.json', ''));
    const metas: SessionMeta[] = [];
    for (const id of ids) {
      const m = await this.readMeta(id);
      if (m) metas.push(m);
    }
    metas.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
    return metas;
  }

  async delete(sessionId: string): Promise<void> {
    await this.drain();
    await Promise.allSettled([unlink(this.jsonlPath(sessionId)), unlink(this.metaPath(sessionId))]);
  }

  async writeMeta(sessionId: string, meta: SessionMeta): Promise<void> {
    await writeFile(this.metaPath(sessionId), JSON.stringify(meta, null, 2), 'utf8');
  }

  async readMeta(sessionId: string): Promise<SessionMeta | null> {
    try {
      const raw = await readFile(this.metaPath(sessionId), 'utf8');
      return JSON.parse(raw) as SessionMeta;
    } catch {
      return null;
    }
  }

  // ── Debounced append queue ──────────────────────────────────────────────
  private enqueue(filePath: string, line: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({ filePath, line, resolve });
      if (!this.flushTimer && !this.flushing) {
        this.flushTimer = setTimeout(() => void this.drain(), FLUSH_MS);
      }
    });
  }

  private async drain(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.flushing) {
      // Wait for the in-flight drain to finish, then check if more arrived
      while (this.flushing) await new Promise((r) => setTimeout(r, 5));
    }
    this.flushing = true;
    try {
      // Group by filePath so each file gets one writev
      const byFile = new Map<string, { lines: string[]; resolves: Array<() => void> }>();
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;
        const bucket = byFile.get(item.filePath) ?? { lines: [], resolves: [] };
        bucket.lines.push(item.line);
        bucket.resolves.push(item.resolve);
        byFile.set(item.filePath, bucket);
      }
      for (const [filePath, bucket] of byFile) {
        try {
          await appendFile(filePath, bucket.lines.join('\n') + '\n', 'utf8');
        } catch (e) {
          this.logger.warn(`Failed to flush ${filePath}: ${(e as Error).message}`);
        }
        for (const r of bucket.resolves) r();
      }
    } finally {
      this.flushing = false;
    }
  }
}
