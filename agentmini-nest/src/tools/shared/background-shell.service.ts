// Tracks background bash processes started by BashTool with run_in_background=true.
// BashOutputTool reads buffered output, KillShellTool terminates them, MonitorTool
// streams new lines as they appear. Output is ring-buffered to MAX_BUFFER_LINES
// so a chatty process can't OOM the server.

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

const MAX_BUFFER_LINES = 5_000;

interface BackgroundShellEntry {
  id: string;
  command: string;
  startedAt: Date;
  finishedAt: Date | null;
  exitCode: number | null;
  child: ChildProcess | null; // null after exit
  stdoutBuf: string[];        // ring buffer
  stderrBuf: string[];
  // Per-stream cursor: index up to which the caller has consumed.
  stdoutCursor: number;
  stderrCursor: number;
  // Listeners attached via Monitor — fired on each new line.
  listeners: Array<(line: { stream: 'stdout' | 'stderr'; text: string }) => void>;
}

@Injectable()
export class BackgroundShellService implements OnModuleDestroy {
  private readonly logger = new Logger(BackgroundShellService.name);
  private readonly shells = new Map<string, BackgroundShellEntry>();

  register(command: string, child: ChildProcess): string {
    const id = `bash_${randomUUID().slice(0, 8)}`;
    const entry: BackgroundShellEntry = {
      id,
      command,
      startedAt: new Date(),
      finishedAt: null,
      exitCode: null,
      child,
      stdoutBuf: [],
      stderrBuf: [],
      stdoutCursor: 0,
      stderrCursor: 0,
      listeners: [],
    };
    this.shells.set(id, entry);

    child.stdout?.on('data', (b: Buffer) => this.absorb(entry, 'stdout', b));
    child.stderr?.on('data', (b: Buffer) => this.absorb(entry, 'stderr', b));
    child.on('exit', (code) => {
      entry.exitCode = code;
      entry.finishedAt = new Date();
      entry.child = null;
      this.logger.log(`Background shell ${id} exited (code=${code})`);
    });
    child.on('error', (e) => {
      this.logger.warn(`Background shell ${id} error: ${e.message}`);
    });
    return id;
  }

  // Read new output since the caller's last read. Returns the text and updates
  // the cursor. Pass which stream(s) to consume.
  readOutput(
    id: string,
    opts: { stream?: 'stdout' | 'stderr' | 'both'; reset?: boolean } = {},
  ): { ok: true; text: string; isRunning: boolean; exitCode: number | null } | { ok: false; error: string } {
    const entry = this.shells.get(id);
    if (!entry) return { ok: false, error: `Unknown shell id: ${id}` };
    const stream = opts.stream ?? 'both';
    let text = '';
    if (stream === 'stdout' || stream === 'both') {
      const slice = entry.stdoutBuf.slice(entry.stdoutCursor);
      text += slice.join('');
      entry.stdoutCursor = entry.stdoutBuf.length;
    }
    if (stream === 'stderr' || stream === 'both') {
      const slice = entry.stderrBuf.slice(entry.stderrCursor);
      const tag = stream === 'both' && slice.length > 0 ? '\n[stderr]\n' : '';
      text += tag + slice.join('');
      entry.stderrCursor = entry.stderrBuf.length;
    }
    if (opts.reset) {
      entry.stdoutCursor = 0;
      entry.stderrCursor = 0;
    }
    return {
      ok: true,
      text,
      isRunning: entry.child !== null,
      exitCode: entry.exitCode,
    };
  }

  list(): Array<{ id: string; command: string; running: boolean; exitCode: number | null; startedAt: string }> {
    return Array.from(this.shells.values()).map((e) => ({
      id: e.id,
      command: e.command,
      running: e.child !== null,
      exitCode: e.exitCode,
      startedAt: e.startedAt.toISOString(),
    }));
  }

  kill(id: string, signal: NodeJS.Signals = 'SIGTERM'): { ok: true; killed: boolean } | { ok: false; error: string } {
    const entry = this.shells.get(id);
    if (!entry) return { ok: false, error: `Unknown shell id: ${id}` };
    if (!entry.child) return { ok: true, killed: false };
    try {
      entry.child.kill(signal);
      return { ok: true, killed: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // Subscribe to live output (Monitor tool). Returns an unsubscribe fn.
  subscribe(id: string, listener: BackgroundShellEntry['listeners'][number]): () => void {
    const entry = this.shells.get(id);
    if (!entry) return () => undefined;
    entry.listeners.push(listener);
    return () => {
      const idx = entry.listeners.indexOf(listener);
      if (idx >= 0) entry.listeners.splice(idx, 1);
    };
  }

  isRunning(id: string): boolean {
    const e = this.shells.get(id);
    return !!e && e.child !== null;
  }

  exitCode(id: string): number | null {
    const e = this.shells.get(id);
    return e ? e.exitCode : null;
  }

  private absorb(entry: BackgroundShellEntry, stream: 'stdout' | 'stderr', b: Buffer): void {
    const text = b.toString('utf8');
    const buf = stream === 'stdout' ? entry.stdoutBuf : entry.stderrBuf;
    buf.push(text);
    if (buf.length > MAX_BUFFER_LINES) {
      const drop = buf.length - MAX_BUFFER_LINES;
      buf.splice(0, drop);
      const cursorKey = stream === 'stdout' ? 'stdoutCursor' : 'stderrCursor';
      entry[cursorKey] = Math.max(0, entry[cursorKey] - drop);
    }
    for (const l of entry.listeners) {
      try { l({ stream, text }); } catch { /* ignore listener errors */ }
    }
  }

  onModuleDestroy(): void {
    for (const e of this.shells.values()) {
      try { e.child?.kill('SIGTERM'); } catch { /* noop */ }
    }
  }
}
