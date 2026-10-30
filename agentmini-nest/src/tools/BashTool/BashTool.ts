// Bash — execute a shell command in the workspace, modeled on Claude Code's BashTool.

import { Inject, Injectable } from '@nestjs/common';
import { execFile, spawn } from 'child_process';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { BackgroundShellService } from '../shared/background-shell.service';
import {
  BASH_TOOL_NAME,
  DEFAULT_TIMEOUT_MS,
  MAX_OUTPUT_BYTES,
  MAX_TIMEOUT_MS,
  PROMPT,
} from './prompt';

const inputSchema = z.strictObject({
  command: z.string().describe('The command to execute'),
  timeout: z
    .number()
    .int()
    .min(100)
    .max(MAX_TIMEOUT_MS)
    .optional()
    .describe(`Optional timeout in milliseconds (max ${MAX_TIMEOUT_MS})`),
  description: z.string().optional().describe(
    `Clear, concise description of what this command does in active voice. Never use words like "complex" or "risk" in the description - just describe what it does.

For simple commands (git, npm, standard CLI tools), keep it brief (5-10 words):
- ls → "List files in current directory"
- git status → "Show working tree status"
- npm install → "Install package dependencies"`,
  ),
  run_in_background: z
    .boolean()
    .optional()
    .describe(
      'When true, spawn the command in the background and return a shell id immediately. Use BashOutput to read accumulated output, KillShell to terminate, and Monitor to stream output. Use this for long-running tasks (dev servers, watchers) so the agent does not block.',
    ),
});

@Injectable()
export class BashTool implements Tool<typeof inputSchema> {
  readonly name = BASH_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = false;
  readonly timeoutMs = MAX_TIMEOUT_MS + 5_000;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly bgShells: BackgroundShellService,
  ) {}

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    if (input.run_in_background) return this.runBackground(input);
    const timeout = input.timeout ?? DEFAULT_TIMEOUT_MS;
    return new Promise<ToolResult>((resolve) => {
      const child = execFile(
        process.env.SHELL || '/bin/bash',
        ['-c', input.command],
        {
          cwd: this.config.workspaceRoot,
          timeout,
          maxBuffer: MAX_OUTPUT_BYTES,
          env: process.env,
        },
        (e, stdout, stderr) => {
          if (e) {
            const ex = e as NodeJS.ErrnoException & { killed?: boolean; signal?: string; code?: number };
            if (ctx.signal.aborted) {
              return resolve(err(`Command was cancelled by client`));
            }
            if (ex.killed && ex.signal === 'SIGTERM') {
              return resolve(err(`Command timed out after ${timeout}ms\n\n${formatOutput(String(stdout || ''), String(stderr || ''), null)}`));
            }
            return resolve(err(formatOutput(String(stdout || ''), String(stderr || ''), typeof ex.code === 'number' ? ex.code : null, ex.message)));
          }
          resolve(ok(formatOutput(String(stdout), String(stderr), 0)));
        },
      );
      // Cancel on client disconnect / engine cancel
      ctx.signal.addEventListener('abort', () => { try { child.kill('SIGTERM'); } catch { /* noop */ } }, { once: true });
    });
  }

  // Spawn the command detached from the request lifecycle. We return immediately
  // with a shell id; the caller polls via BashOutput / Monitor / KillShell.
  // NOTE: background shells deliberately survive the originating tool call —
  // they are tied to the server process lifetime, not the request.
  private async runBackground(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    try {
      const child = spawn(process.env.SHELL || '/bin/bash', ['-c', input.command], {
        cwd: this.config.workspaceRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const id = this.bgShells.register(input.command, child);
      return ok(
        `Started background shell ${id} for: ${input.command}\n` +
          `Use BashOutput({"shellId":"${id}"}) to read output, ` +
          `KillShell({"shellId":"${id}"}) to terminate.`,
      );
    } catch (e) {
      return err(`Failed to spawn background command: ${(e as Error).message}`);
    }
  }
}

function formatOutput(stdout: string, stderr: string, code: number | null, fallbackMsg?: string): string {
  const parts: string[] = [];
  if (code !== null) parts.push(`Exit code: ${code}`);
  if (stdout) parts.push(`STDOUT:\n${truncate(stdout)}`);
  if (stderr) parts.push(`STDERR:\n${truncate(stderr)}`);
  if (!stdout && !stderr) parts.push(fallbackMsg ?? '(no output)');
  return parts.join('\n\n');
}

function truncate(s: string): string {
  return s.length > MAX_OUTPUT_BYTES
    ? s.slice(0, MAX_OUTPUT_BYTES) + `\n... (truncated; output exceeded ${MAX_OUTPUT_BYTES} bytes)`
    : s;
}
