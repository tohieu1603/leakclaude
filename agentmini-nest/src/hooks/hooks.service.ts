// Loads hooks config and executes hooks for each lifecycle event.
//
// Lookup order for the config file:
//   1. $AGENTMINI_HOOKS_FILE (absolute path)
//   2. <workspaceRoot>/.agentmini/hooks.json
//   3. ~/.agentmini-nest/hooks.json
// First file that exists wins. If none exist, the service is a no-op.
//
// Hooks are spawned via execFile with stdin = JSON payload, stdout parsed as
// JSON. Hook errors NEVER crash the engine — they are logged and the event
// is treated as "no opinion" (pass-through). This is essential: a broken hook
// should not break the agent.

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import type {
  HookConfig,
  HookEvent,
  HookPayload,
  HookResponse,
  HooksFile,
} from './hooks.types';

const DEFAULT_HOOK_TIMEOUT_MS = 5_000;

@Injectable()
export class HooksService implements OnModuleInit {
  private readonly logger = new Logger(HooksService.name);
  private hooks: HooksFile = {};
  private loadedFrom: string | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async onModuleInit(): Promise<void> {
    await this.load();
  }

  // Reload hooks from disk. Exposed so a /hooks slash command (future) or
  // SIGHUP handler can refresh without restarting the server.
  async load(): Promise<void> {
    const candidates = [
      process.env.AGENTMINI_HOOKS_FILE,
      path.join(this.config.workspaceRoot, '.agentmini', 'hooks.json'),
      path.join(os.homedir(), '.agentmini-nest', 'hooks.json'),
    ].filter((p): p is string => !!p);

    for (const file of candidates) {
      try {
        const raw = await fs.readFile(file, 'utf8');
        const parsed = JSON.parse(raw) as HooksFile;
        this.hooks = parsed;
        this.loadedFrom = file;
        const counts = Object.entries(parsed)
          .map(([k, v]) => `${k}:${(v as HookConfig[]).length}`)
          .join(' ');
        this.logger.log(`Loaded hooks from ${file} (${counts || 'empty'})`);
        return;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.logger.warn(`Failed to parse hooks file ${file}: ${(e as Error).message}`);
        }
      }
    }
    this.hooks = {};
    this.loadedFrom = null;
  }

  status(): { enabled: boolean; file: string | null; counts: Record<string, number> } {
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.hooks)) counts[k] = (v as HookConfig[]).length;
    return { enabled: Object.keys(this.hooks).length > 0, file: this.loadedFrom, counts };
  }

  // Run all hooks matching this event. Returns the consensus response — if
  // ANY hook denies, the whole event is denied; if any hook modifies, the
  // last modify response wins.
  async run(payload: HookPayload): Promise<HookResponse> {
    const event = payload.event as HookEvent;
    const list = this.hooks[event] ?? [];
    if (list.length === 0) return {};

    let merged: HookResponse = {};
    for (const cfg of list) {
      if (cfg.disabled) continue;
      // Tool-name matcher only applies to tool events.
      if (cfg.matcher && (event === 'PreToolUse' || event === 'PostToolUse')) {
        const tname = (payload as { toolName?: string }).toolName ?? '';
        try {
          if (!new RegExp(cfg.matcher).test(tname)) continue;
        } catch {
          // Invalid regex — treat as no-match rather than crash.
          continue;
        }
      }
      const resp = await this.execHook(cfg, payload);
      if (!resp) continue;
      if (resp.decision === 'deny') {
        // Short-circuit on first deny.
        return resp;
      }
      if (resp.decision === 'modify') {
        merged = { ...merged, ...resp, decision: 'modify' };
      } else if (!merged.decision) {
        merged = { ...merged, ...resp };
      }
      // Always accumulate additionalContext from every hook
      if (resp.additionalContext) {
        merged.additionalContext = [merged.additionalContext, resp.additionalContext]
          .filter(Boolean)
          .join('\n\n');
      }
    }
    return merged;
  }

  private async execHook(cfg: HookConfig, payload: HookPayload): Promise<HookResponse | null> {
    const timeoutMs = cfg.timeoutMs ?? DEFAULT_HOOK_TIMEOUT_MS;
    return new Promise<HookResponse | null>((resolve) => {
      let resolved = false;
      const done = (v: HookResponse | null) => {
        if (resolved) return;
        resolved = true;
        resolve(v);
      };
      const child = spawn(process.env.SHELL || '/bin/bash', ['-c', cfg.command], {
        cwd: this.config.workspaceRoot,
        env: { ...process.env, AGENTMINI_HOOK_EVENT: payload.event },
      });
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      child.stdout.on('data', (b: Buffer) => stdoutChunks.push(b));
      child.stderr.on('data', (b: Buffer) => stderrChunks.push(b));
      child.on('error', (e) => {
        this.logger.warn(`Hook spawn failed: ${e.message}`);
        done(null);
      });
      child.on('close', (code) => {
        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
        if (stderr) this.logger.debug(`Hook stderr: ${stderr}`);
        if (code !== 0) {
          this.logger.warn(`Hook exited ${code}: ${cfg.command}`);
          return done(null);
        }
        const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();
        if (!stdout) return done({});
        try {
          done(JSON.parse(stdout) as HookResponse);
        } catch {
          // Treat any non-JSON output as additionalContext (most hook authors
          // write plain text to stdout — let it through as a system reminder).
          done({ additionalContext: stdout });
        }
      });
      const timer = setTimeout(() => {
        try { child.kill('SIGTERM'); } catch { /* noop */ }
        this.logger.warn(`Hook timed out after ${timeoutMs}ms: ${cfg.command}`);
        done(null);
      }, timeoutMs);
      child.on('close', () => clearTimeout(timer));
      try {
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
      } catch {
        done(null);
      }
    });
  }
}
