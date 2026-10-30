// Collects every tool registered under the TOOL multi-provider, validates
// input with Zod, enforces per-tool timeout + maxResultSizeChars, and
// propagates AbortSignal to long-running tools.

import { Inject, Injectable, Logger } from '@nestjs/common';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TOOL, type AnyTool, type ToolResult, err } from './tool.interface';
import type { ToolDefinition } from '../common/types';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESULT_CHARS = 100_000;

@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private readonly tools = new Map<string, AnyTool>();

  constructor(@Inject(TOOL) injected: AnyTool[]) {
    for (const tool of injected) {
      if (this.tools.has(tool.name)) {
        throw new Error(`Tool "${tool.name}" already registered`);
      }
      this.tools.set(tool.name, tool);
    }
    this.logger.log(`Registered ${this.tools.size} tools: ${this.names().join(', ')}`);
  }

  get(name: string): AnyTool | undefined {
    return this.tools.get(name);
  }

  names(): string[] {
    return Array.from(this.tools.keys());
  }

  // Dynamically register a tool after construction. Used by the MCP bootstrap
  // service to add tools discovered from external MCP servers at runtime.
  // Conflicting names are rejected so accidental shadowing of built-in tools
  // is caught early.
  register(tool: AnyTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(
        `Refusing to register tool "${tool.name}": a tool with that name is already registered`,
      );
    }
    this.tools.set(tool.name, tool);
    this.logger.log(`Dynamically registered tool: ${tool.name}`);
  }

  // Inverse — used when an MCP server disconnects so we don't leave stale
  // tool definitions exposed to the model.
  unregister(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) this.logger.log(`Unregistered tool: ${name}`);
    return removed;
  }

  // True when this tool can run in parallel with other concurrency-safe tools.
  isConcurrencySafe(name: string): boolean {
    const t = this.tools.get(name);
    if (!t) return false;
    return t.concurrencySafe ?? t.readOnly;
  }

  // Build OpenAI-compatible tool definitions. Uses each tool's `prompt` as
  // the function description so the LLM gets full usage guidance. If the
  // tool has a pre-built JSON Schema (MCP tools), use it verbatim instead
  // of converting from Zod.
  toDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => {
      let parameters: Record<string, unknown>;
      if (tool.jsonSchema) {
        const { $schema: _drop, ...rest } = tool.jsonSchema as Record<string, unknown>;
        parameters = rest;
      } else {
        const converted = zodToJsonSchema(tool.schema as never, {
          target: 'openAi',
          $refStrategy: 'none',
        }) as Record<string, unknown>;
        const { $schema: _drop, ...rest } = converted;
        parameters = rest;
      }
      return {
        type: 'function',
        function: { name: tool.name, description: tool.prompt, parameters },
      };
    });
  }

  // Execute a tool with input validation + timeout + signal + size cap.
  // Errors are returned as ToolResult so the agent loop can recover gracefully.
  async execute(name: string, rawInput: unknown, signal: AbortSignal): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return err(`Tool "${name}" not found. Available: ${this.names().join(', ')}`);
    }
    // Models often emit JSON nulls for optional fields ("path": null) instead
    // of omitting them. Zod's .optional() rejects null, which would force the
    // model into a retry loop on every Glob/Grep/Bash call. Strip top-level
    // nulls before validating so optional fields behave as the model expects.
    const cleaned = stripTopLevelNulls(rawInput);
    const parsed = tool.schema.safeParse(cleaned ?? {});
    if (!parsed.success) {
      return err(`Invalid input for "${name}": ${JSON.stringify(parsed.error.flatten())}`);
    }

    const timeoutMs = tool.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxChars = tool.maxResultSizeChars ?? DEFAULT_MAX_RESULT_CHARS;

    // Combine caller's abort + per-tool timeout
    const timeoutCtl = new AbortController();
    const timeoutId = setTimeout(() => timeoutCtl.abort(new Error('tool timeout')), timeoutMs);
    const combined = combineSignals(signal, timeoutCtl.signal);

    let result: ToolResult;
    try {
      result = await Promise.race([
        tool.call(parsed.data, { signal: combined }),
        rejectOnAbort(combined),
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (signal.aborted) return err(`Tool "${name}" was cancelled by client`);
      if (timeoutCtl.signal.aborted) return err(`Tool "${name}" timed out after ${timeoutMs}ms`);
      this.logger.warn(`Tool "${name}" failed: ${msg}`);
      return err(`Tool "${name}" execution failed: ${msg}`);
    } finally {
      clearTimeout(timeoutId);
    }

    // Apply tool-output size cap (matches Claude Code's maxResultSizeChars)
    if (result.content.length > maxChars) {
      result = {
        content: result.content.slice(0, maxChars) + `\n... (output truncated; exceeded ${maxChars} chars)`,
        isError: result.isError,
      };
    }
    return result;
  }
}

// AbortSignal.any may not exist on older Node; provide a polyfill.
function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const Any = (AbortSignal as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (Any) return Any(signals);
  const ctl = new AbortController();
  for (const s of signals) {
    if (s.aborted) { ctl.abort(s.reason); break; }
    s.addEventListener('abort', () => ctl.abort(s.reason), { once: true });
  }
  return ctl.signal;
}

function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) return reject(new Error('aborted'));
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
}

// Drop top-level keys whose value is `null`. Used to normalize LLM-emitted
// tool args before Zod validation: optional fields should accept omission
// regardless of whether the model omitted the key or set it to null.
function stripTopLevelNulls(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v !== null) out[k] = v;
  }
  return out;
}
