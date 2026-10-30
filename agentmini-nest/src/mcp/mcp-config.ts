// Loads MCP server configuration from .mcp.json. Matches the Claude Code /
// Claude Desktop format so existing config can be reused without changes.
//
// Supported transports:
//   - stdio (default; spawn a child process)
//   - http  (streamable HTTP using SDK's StreamableHTTPClientTransport)
//   - sse   (legacy SSE)
//
// Env-style ${VAR} interpolation is applied to command, args, env values
// and url after parsing.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { expandObjectStrings } from './env-expansion';

const StdioServerSchema = z.object({
  // type defaults to 'stdio' for backward compat
  type: z.literal('stdio').optional(),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  disabled: z.boolean().default(false),
});

const HttpServerSchema = z.object({
  type: z.literal('http'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  disabled: z.boolean().default(false),
});

const SseServerSchema = z.object({
  type: z.literal('sse'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  disabled: z.boolean().default(false),
});

const ServerSchema = z.union([HttpServerSchema, SseServerSchema, StdioServerSchema]);

const McpConfigSchema = z.object({
  mcpServers: z.record(ServerSchema).default({}),
});

export type StdioServerConfig = z.infer<typeof StdioServerSchema>;
export type HttpServerConfig = z.infer<typeof HttpServerSchema>;
export type SseServerConfig = z.infer<typeof SseServerSchema>;
export type McpServerConfig = z.infer<typeof ServerSchema>;
export type McpConfig = z.infer<typeof McpConfigSchema>;

export function getTransportType(s: McpServerConfig): 'stdio' | 'http' | 'sse' {
  if ('url' in s && 'type' in s) {
    return (s as { type: 'http' | 'sse' }).type;
  }
  return 'stdio';
}

export function isStdio(s: McpServerConfig): s is StdioServerConfig {
  return getTransportType(s) === 'stdio';
}

export function isHttp(s: McpServerConfig): s is HttpServerConfig {
  return getTransportType(s) === 'http';
}

export function isSse(s: McpServerConfig): s is SseServerConfig {
  return getTransportType(s) === 'sse';
}

export function loadMcpConfig(searchDir: string): McpConfig {
  const candidates = [
    join(searchDir, '.mcp.json'),
    join(searchDir, 'mcp.json'),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Invalid JSON in ${path}: ${(e as Error).message}`);
    }
    const result = McpConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid MCP config in ${path}: ${JSON.stringify(result.error.flatten())}`);
    }
    // Apply env-var expansion to the parsed object
    return expandObjectStrings(result.data);
  }
  return { mcpServers: {} };
}
