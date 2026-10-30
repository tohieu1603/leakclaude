// Adapter that wraps a single MCP tool (from an MCP server) so it conforms to
// AgentMini-Nest's Tool interface. The agent loop and ToolRegistry don't need
// to know the tool comes from MCP — it looks just like a built-in.
//
// Naming: MCP tool names are prefixed with "<server>__" so two servers can
// expose the same tool name without collision (e.g. github__read_file vs
// filesystem__read_file). The model sees the prefixed name.

import { z } from 'zod';
import type { Tool, ToolCallContext, ToolResult } from '../tools/tool.interface';
import { ok, err } from '../tools/tool.interface';
import type { McpClient, McpToolInfo } from './mcp-client.service';
import { buildMcpToolName } from './name-utils';

// MCP doesn't tell us if a tool mutates state, so we conservatively treat MCP
// tools as NOT concurrency-safe (run sequentially). Per-tool overrides could
// come from a future allowlist.
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RESULT_CHARS = 100_000;

export class McpToolAdapter implements Tool<z.ZodTypeAny> {
  readonly name: string;
  readonly prompt: string;
  readonly schema: z.ZodTypeAny;
  readonly jsonSchema: Record<string, unknown>;
  readonly readOnly = false;
  readonly concurrencySafe = false;
  readonly timeoutMs = DEFAULT_TIMEOUT_MS;
  readonly maxResultSizeChars = DEFAULT_MAX_RESULT_CHARS;

  // Cache original MCP tool name (without prefix) for the actual call
  private readonly mcpName: string;

  constructor(
    private readonly client: McpClient,
    info: McpToolInfo,
  ) {
    this.mcpName = info.name;
    // Naming convention matches Claude Code exactly: mcp__<server>__<tool>.
    // The leading mcp__ token lets the LLM (and grep) reliably identify
    // MCP-sourced tools versus built-ins. The double underscore is also a
    // safe identifier separator across every transport that has rules.
    this.name = buildMcpToolName(client.serverName, info.name);
    this.prompt = info.description || `MCP tool ${this.name} (no description provided)`;
    // We don't convert JSON Schema back to Zod; instead we accept any object
    // input here and let the MCP server validate. The model sees the proper
    // JSON Schema via `jsonSchema` below, which the registry uses verbatim.
    this.schema = z.record(z.unknown());
    this.jsonSchema = info.inputSchema;
  }

  async call(input: z.infer<typeof this.schema>, ctx: ToolCallContext): Promise<ToolResult> {
    if (ctx.signal.aborted) return err('Request cancelled before tool execution');
    try {
      const args = (input ?? {}) as Record<string, unknown>;
      const result = await this.client.callTool(this.mcpName, args);
      return result.isError ? err(result.content) : ok(result.content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return err(`MCP call failed (${this.client.serverName}/${this.mcpName}): ${msg}`);
    }
  }
}
