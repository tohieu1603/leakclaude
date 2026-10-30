// ClientSessionMap — remembers the most recent sessionId per client so a curl
// user (or any client that doesn't track session IDs locally) gets multi-turn
// continuity automatically.
//
// Client identity resolution order (first wins):
//   1. X-Client-Id header (explicit, opt-in for clients that want isolation)
//   2. X-Forwarded-For + User-Agent fingerprint (best-effort behind proxies)
//   3. remote IP + User-Agent
//   4. literal "default" (single-tenant dev mode fallback)
//
// State is in-memory only — server restart resets the map. Persisted sessions
// on disk are still resumable by passing sessionId explicitly or via /resume.

import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ClientSessionMap {
  private readonly map = new Map<string, { sessionId: string; updatedAt: number }>();

  resolveClientId(req: Request): string {
    const explicit = req.header('x-client-id');
    if (explicit) return `header:${explicit}`;
    const ua = (req.header('user-agent') ?? 'unknown').slice(0, 80);
    const ip = (req.header('x-forwarded-for') ?? req.ip ?? req.socket.remoteAddress ?? 'unknown').toString().split(',')[0].trim();
    return `${ip}:${ua}`;
  }

  get(clientId: string): string | null {
    return this.map.get(clientId)?.sessionId ?? null;
  }

  set(clientId: string, sessionId: string): void {
    this.map.set(clientId, { sessionId, updatedAt: Date.now() });
  }

  // Drop a clientId mapping (e.g. when the user runs /clear).
  forget(clientId: string): void {
    this.map.delete(clientId);
  }
}
