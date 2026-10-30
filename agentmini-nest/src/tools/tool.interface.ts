// Tool abstraction modeled on Claude Code's Tool.ts buildTool.
// Each tool is a class registered under the TOOL multi-provider; the registry
// validates input, enforces per-tool size + timeout, and propagates AbortSignal.

import type { z } from 'zod';
import type { ToolDefinition } from '../common/types';

export interface ToolResult {
  content: string;
  isError: boolean;
}

export const ok = (content: string): ToolResult => ({ content, isError: false });
export const err = (message: string): ToolResult => ({ content: message, isError: true });

export const TOOL = Symbol('TOOL');

export interface ToolCallContext {
  // Aborted when the client disconnects or the engine cancels the turn.
  // Long-running tools (Bash, WebFetch, WebSearch, Sleep) MUST respect it.
  readonly signal: AbortSignal;
}

export interface Tool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  // PascalCase, matches Claude Code (Read, Bash, WebFetch, ...)
  readonly name: string;
  // Long-form prompt sent as the LLM-facing function description
  readonly prompt: string;
  // Zod schema used for input validation. For built-in tools the registry
  // converts this to JSON Schema; MCP-sourced tools should also provide
  // `jsonSchema` (below) to ship the upstream schema verbatim.
  readonly schema: TSchema;
  // Optional: pre-built JSON Schema. When present the registry uses it
  // directly instead of converting `schema` via zod-to-json-schema. Used by
  // MCP tools whose authoritative schema is JSON Schema, not Zod.
  readonly jsonSchema?: Record<string, unknown>;
  // True if the tool only reads state. Read-only tools are concurrency-safe.
  readonly readOnly: boolean;
  // Whether multiple invocations can run in parallel within the same turn.
  readonly concurrencySafe?: boolean;
  // Soft per-tool timeout enforced by the registry (ms). Default 30s.
  readonly timeoutMs?: number;
  // Hard cap on tool output size. Truncated by the registry. Default 100K chars.
  readonly maxResultSizeChars?: number;

  call(input: z.infer<TSchema>, ctx: ToolCallContext): Promise<ToolResult>;
}

export type AnyTool = Tool<z.ZodTypeAny>;

export interface ResolvedToolDefinition {
  tool: AnyTool;
  definition: ToolDefinition;
}
