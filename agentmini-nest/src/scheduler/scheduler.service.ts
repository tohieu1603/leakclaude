// In-process scheduler for delayed / recurring agent runs ("crons"). Persists
// to disk so jobs survive a restart. Each job stores the prompt to fire; when
// the time arrives, the scheduler enqueues a regular run via the AgentRunner.
//
// Limitations:
//   - resolution = 30s
//   - intervals are cron-ish (every N seconds / minutes / hours) not full
//     5-field crontab — keep it simple for graduation-project scope
//   - one server only — for HA you'd swap the disk store for Redis/Postgres
//
// On boot we re-load all jobs and schedule their next fire time. Jobs missed
// while the server was down are NOT replayed; they pick up at the next slot.

import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { AgentRunner } from '../agents/agent-runner.service';

export interface CronJob {
  id: string;
  name: string;
  prompt: string;
  intervalSeconds: number; // 0 → one-shot
  startAt: string; // ISO date for first fire
  lastRunAt: string | null;
  nextRunAt: string;
  enabled: boolean;
}

const TICK_INTERVAL_MS = 30_000;
const STORE_FILENAME = 'crons.json';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private jobs = new Map<string, CronJob>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly runner: AgentRunner,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.load();
    this.timer = setInterval(() => void this.tick(), TICK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  list(): CronJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt));
  }

  async create(input: {
    name: string;
    prompt: string;
    intervalSeconds: number;
    startAt?: string;
  }): Promise<CronJob> {
    const id = `cron_${randomUUID().slice(0, 8)}`;
    const startAt = input.startAt ?? new Date(Date.now() + Math.max(input.intervalSeconds, 30) * 1000).toISOString();
    const job: CronJob = {
      id,
      name: input.name,
      prompt: input.prompt,
      intervalSeconds: input.intervalSeconds,
      startAt,
      lastRunAt: null,
      nextRunAt: startAt,
      enabled: true,
    };
    this.jobs.set(id, job);
    await this.save();
    this.logger.log(`Scheduled cron ${id} (${input.name}) → next ${startAt}`);
    return job;
  }

  async update(id: string, patch: Partial<Pick<CronJob, 'enabled' | 'intervalSeconds' | 'prompt'>>): Promise<CronJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    Object.assign(job, patch);
    await this.save();
    return job;
  }

  async remove(id: string): Promise<boolean> {
    const removed = this.jobs.delete(id);
    if (removed) await this.save();
    return removed;
  }

  // Tick handler — find any job whose nextRunAt has passed and fire it.
  private async tick(): Promise<void> {
    const now = Date.now();
    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;
      if (new Date(job.nextRunAt).getTime() > now) continue;
      void this.fire(job);
    }
  }

  private async fire(job: CronJob): Promise<void> {
    job.lastRunAt = new Date().toISOString();
    if (job.intervalSeconds > 0) {
      job.nextRunAt = new Date(Date.now() + job.intervalSeconds * 1000).toISOString();
    } else {
      // One-shot — disable after fire
      job.enabled = false;
    }
    await this.save();
    this.logger.log(`Firing cron ${job.id} (${job.name})`);
    try {
      // Detached AbortController — cron jobs aren't tied to a client request
      const ctrl = new AbortController();
      const r = await this.runner.run({
        agentType: 'general-purpose',
        prompt: job.prompt,
        parentSignal: ctrl.signal,
        maxTurns: 5,
      });
      this.logger.log(`Cron ${job.id} done: ${r.turns} turn(s), ${r.inputTokens}+${r.outputTokens} tokens`);
    } catch (e) {
      this.logger.warn(`Cron ${job.id} failed: ${(e as Error).message}`);
    }
  }

  private storePath(): string {
    return path.join(this.config.workspaceRoot, '.agentmini', STORE_FILENAME);
  }

  private async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.storePath(), 'utf8');
      const parsed = JSON.parse(raw) as CronJob[];
      this.jobs = new Map(parsed.map((j) => [j.id, j]));
      this.logger.log(`Loaded ${this.jobs.size} cron job(s) from disk`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Failed to load crons: ${(e as Error).message}`);
      }
    }
  }

  private async save(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.storePath()), { recursive: true });
      await fs.writeFile(this.storePath(), JSON.stringify(this.list(), null, 2), 'utf8');
    } catch (e) {
      this.logger.warn(`Failed to save crons: ${(e as Error).message}`);
    }
  }
}
