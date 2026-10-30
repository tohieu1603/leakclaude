// Per-server MCP client. Wraps the official SDK Client and supports three
// transports (stdio, http streamable, sse) following Claude Code's
// services/mcp/client.ts pattern.
//
// State machine:                disconnect / error
//   pending → connecting → connected ──────────────→ failed
//                                  ↓ close()
//                                disconnected
//
// Capabilities surfaced for downstream consumers (built-in ListMcpResources
// + MCP prompt registration) are read from the server's initialize response.

import { Logger } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  getTransportType,
  type HttpServerConfig,
  type McpServerConfig,
  type SseServerConfig,
  type StdioServerConfig,
} from './mcp-config';

export interface McpToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpResourceInfo {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface McpPromptInfo {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface McpCallResult {
  content: string;
  isError: boolean;
}

export type McpConnectionState =
  | { status: 'pending' }
  | { status: 'connecting' }
  | { status: 'connected'; capabilities: Record<string, unknown> }
  | { status: 'failed'; error: string }
  | { status: 'disconnected' };

const CLIENT_INFO = { name: 'agentmini-nest', version: '1.0.0' };
const CLIENT_CAPABILITIES = {};

export class McpClient {
  private readonly logger: Logger;
  private client: Client | null = null;
  private transport: Transport | null = null;
  public state: McpConnectionState = { status: 'pending' };

  constructor(
    public readonly serverName: string,
    private readonly config: McpServerConfig,
  ) {
    this.logger = new Logger(`McpClient:${serverName}`);
  }

  get transportType(): 'stdio' | 'http' | 'sse' {
    return getTransportType(this.config);
  }

  async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') return;
    this.state = { status: 'connecting' };

    try {
      this.transport = this.buildTransport();
      this.client = new Client(CLIENT_INFO, { capabilities: CLIENT_CAPABILITIES });
      await this.client.connect(this.transport);
      const caps = (this.client.getServerCapabilities?.() ?? {}) as Record<string, unknown>;
      this.state = { status: 'connected', capabilities: caps };
      this.logger.log(`Connected (${this.transportType}); capabilities: ${Object.keys(caps).join(', ') || 'none'}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.state = { status: 'failed', error: msg };
      this.logger.warn(`Connect failed: ${msg}`);
      throw e;
    }
  }

  private buildTransport(): Transport {
    const t = this.transportType;
    if (t === 'stdio') {
      const c = this.config as StdioServerConfig;
      return new StdioClientTransport({
        command: c.command,
        args: c.args,
        env: { ...process.env, ...c.env } as Record<string, string>,
        cwd: c.cwd,
      });
    }
    if (t === 'http') {
      const c = this.config as HttpServerConfig;
      return new StreamableHTTPClientTransport(new URL(c.url), {
        requestInit: c.headers ? { headers: c.headers } : undefined,
      });
    }
    // sse
    const c = this.config as SseServerConfig;
    return new SSEClientTransport(new URL(c.url), {
      requestInit: c.headers ? { headers: c.headers } : undefined,
    });
  }

  private requireClient(): Client {
    if (!this.client || this.state.status !== 'connected') {
      throw new Error(`MCP client "${this.serverName}" is not connected (state=${this.state.status})`);
    }
    return this.client;
  }

  async listTools(): Promise<McpToolInfo[]> {
    const c = this.requireClient();
    const res = await c.listTools();
    return (res.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: (t.inputSchema ?? { type: 'object', properties: {} }) as Record<string, unknown>,
    }));
  }

  async listResources(): Promise<McpResourceInfo[]> {
    const caps = this.state.status === 'connected' ? this.state.capabilities : {};
    if (!('resources' in caps)) return [];
    const c = this.requireClient();
    try {
      const res = await c.listResources();
      return (res.resources ?? []).map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      }));
    } catch (e) {
      this.logger.warn(`listResources failed: ${(e as Error).message}`);
      return [];
    }
  }

  async listPrompts(): Promise<McpPromptInfo[]> {
    const caps = this.state.status === 'connected' ? this.state.capabilities : {};
    if (!('prompts' in caps)) return [];
    const c = this.requireClient();
    try {
      const res = await c.listPrompts();
      return (res.prompts ?? []).map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments?.map((a) => ({
          name: a.name,
          description: a.description,
          required: a.required,
        })),
      }));
    } catch (e) {
      this.logger.warn(`listPrompts failed: ${(e as Error).message}`);
      return [];
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpCallResult> {
    const c = this.requireClient();
    const result = await c.callTool({ name, arguments: args });
    return this.flattenContent(result.content, result.isError === true);
  }

  async readResource(uri: string): Promise<McpCallResult> {
    const c = this.requireClient();
    const result = await c.readResource({ uri });
    const blocks = (result.contents ?? []).map((b) => {
      const obj = b as { text?: string; uri?: string; mimeType?: string; blob?: string };
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.blob === 'string') {
        return `[binary ${obj.mimeType ?? 'application/octet-stream'} at ${obj.uri ?? uri}, base64: ${obj.blob.slice(0, 64)}…]`;
      }
      return JSON.stringify(b);
    });
    return { content: blocks.join('\n\n') || '(empty resource)', isError: false };
  }

  async getPrompt(name: string, args: Record<string, string>): Promise<string> {
    const c = this.requireClient();
    const result = await c.getPrompt({ name, arguments: args });
    const messages = (result.messages ?? []).map((m) => {
      const obj = m as { role: string; content: unknown };
      const content = obj.content as { type?: string; text?: string };
      return `[${obj.role}] ${content.text ?? JSON.stringify(content)}`;
    });
    return messages.join('\n\n') || '(empty prompt)';
  }

  // Flatten MCP content blocks (text / image / resource) to a single string for
  // the agent loop, preserving the error flag.
  private flattenContent(content: unknown, isError: boolean): McpCallResult {
    const blocks = Array.isArray(content) ? content : [];
    const parts: string[] = [];
    for (const block of blocks) {
      if (typeof block !== 'object' || block === null) continue;
      const b = block as { type?: string; text?: string; data?: string; mimeType?: string };
      if (b.type === 'text' && typeof b.text === 'string') parts.push(b.text);
      else if (b.type === 'image') parts.push(`[image ${b.mimeType ?? ''} omitted]`);
      else parts.push(JSON.stringify(block));
    }
    return { content: parts.join('\n') || '(empty result)', isError };
  }

  async close(): Promise<void> {
    if (this.state.status === 'disconnected' || this.state.status === 'pending') return;
    try {
      await this.client?.close();
    } catch (e) {
      this.logger.warn(`close error: ${(e as Error).message}`);
    }
    this.client = null;
    this.transport = null;
    this.state = { status: 'disconnected' };
    this.logger.log('Disconnected');
  }
}
