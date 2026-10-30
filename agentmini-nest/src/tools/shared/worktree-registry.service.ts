// Tracks git worktrees created via EnterWorktree so ExitWorktree can clean
// them up properly. The registry survives the lifetime of the server; if
// the server crashes, the user can `git worktree prune` to recover.

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { execFile } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

export interface WorktreeEntry {
  id: string;
  path: string;
  branch: string;
  baseBranch: string;
  createdAt: Date;
  repoRoot: string;
}

const WORKTREE_DIR = path.join(os.tmpdir(), 'agentmini-worktrees');

@Injectable()
export class WorktreeRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(WorktreeRegistry.name);
  private readonly worktrees = new Map<string, WorktreeEntry>();

  async create(repoRoot: string, baseBranch?: string): Promise<WorktreeEntry> {
    await fs.mkdir(WORKTREE_DIR, { recursive: true });
    const id = `wt_${randomUUID().slice(0, 8)}`;
    const dir = path.join(WORKTREE_DIR, id);
    const branch = `agentmini/${id}`;
    const base = baseBranch ?? (await this.detectDefaultBranch(repoRoot));
    await this.git(repoRoot, ['worktree', 'add', '-b', branch, dir, base]);
    const entry: WorktreeEntry = {
      id,
      path: dir,
      branch,
      baseBranch: base,
      createdAt: new Date(),
      repoRoot,
    };
    this.worktrees.set(id, entry);
    this.logger.log(`Created worktree ${id} at ${dir} on branch ${branch}`);
    return entry;
  }

  async remove(id: string, opts: { keepBranch?: boolean } = {}): Promise<{
    removed: boolean;
    branch: string;
    path: string;
    hadChanges: boolean;
  }> {
    const entry = this.worktrees.get(id);
    if (!entry) return { removed: false, branch: '', path: '', hadChanges: false };
    let hadChanges = false;
    try {
      const status = await this.git(entry.repoRoot, ['-C', entry.path, 'status', '--porcelain']);
      hadChanges = status.trim().length > 0;
    } catch {
      // ignore status errors
    }
    try {
      await this.git(entry.repoRoot, ['worktree', 'remove', '--force', entry.path]);
    } catch (e) {
      this.logger.warn(`worktree remove failed: ${(e as Error).message}`);
    }
    if (!opts.keepBranch && !hadChanges) {
      try { await this.git(entry.repoRoot, ['branch', '-D', entry.branch]); }
      catch { /* ignore */ }
    }
    this.worktrees.delete(id);
    return { removed: true, branch: entry.branch, path: entry.path, hadChanges };
  }

  list(): WorktreeEntry[] {
    return Array.from(this.worktrees.values());
  }

  get(id: string): WorktreeEntry | undefined {
    return this.worktrees.get(id);
  }

  async onModuleDestroy(): Promise<void> {
    // Leave worktrees in place on shutdown — they may still be useful to the
    // user. They're easy to clean up with `git worktree prune`.
  }

  private async detectDefaultBranch(repoRoot: string): Promise<string> {
    try {
      const out = await this.git(repoRoot, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
      const m = /refs\/remotes\/origin\/(.+)/.exec(out.trim());
      if (m) return m[1]!;
    } catch { /* fall through */ }
    return 'HEAD';
  }

  private git(cwd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('git', args, { cwd, maxBuffer: 5 * 1024 * 1024 }, (e, stdout, stderr) => {
        if (e) return reject(new Error(`git ${args.join(' ')} failed: ${stderr || e.message}`));
        resolve(String(stdout));
      });
    });
  }
}
