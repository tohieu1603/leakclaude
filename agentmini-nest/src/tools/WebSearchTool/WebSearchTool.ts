// WebSearch — modeled on Claude Code's WebSearchTool input shape.
// Provider order: Brave (if key set) → DuckDuckGo. Transient failures retry.

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { sleep } from '../../common/sleep';
import {
  applyDomainFilters,
  searchBrave,
  searchDuckDuckGo,
  TransientSearchError,
  type SearchHit,
} from './providers';
import { getPrompt, WEB_SEARCH_TOOL_NAME } from './prompt';

const inputSchema = z.strictObject({
  query: z.string().min(2).describe('The search query to use'),
  allowed_domains: z.array(z.string()).optional().describe('Only include search results from these domains'),
  blocked_domains: z.array(z.string()).optional().describe('Never include search results from these domains'),
});

const MAX_RETRIES = 2;
const RESULT_COUNT = 8;

@Injectable()
export class WebSearchTool implements Tool<typeof inputSchema> {
  readonly name = WEB_SEARCH_TOOL_NAME;
  readonly prompt = getPrompt();
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly timeoutMs = 25_000;
  private readonly logger = new Logger(WebSearchTool.name);

  async call(input: z.infer<typeof inputSchema>, _ctx: ToolCallContext): Promise<ToolResult> {
    const providers: Array<{ name: string; run: () => Promise<SearchHit[]> }> = [];
    if (process.env.BRAVE_SEARCH_API_KEY) {
      providers.push({ name: 'Brave', run: () => searchBrave(input.query, RESULT_COUNT) });
    }
    providers.push({ name: 'DuckDuckGo', run: () => searchDuckDuckGo(input.query, RESULT_COUNT) });

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        const hits = await this.runWithRetry(provider.run);
        const filtered = applyDomainFilters(hits, input.allowed_domains, input.blocked_domains);
        if (filtered.length === 0) {
          errors.push(`${provider.name}: no results after domain filter`);
          continue;
        }
        return ok(formatResults(filtered, input.query, provider.name));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Search provider ${provider.name} failed: ${msg}`);
        errors.push(`${provider.name}: ${msg}`);
      }
    }
    return err(`All search providers failed.\n${errors.join('\n')}`);
  }

  private async runWithRetry(fn: () => Promise<SearchHit[]>): Promise<SearchHit[]> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (!(e instanceof TransientSearchError) || attempt === MAX_RETRIES) throw e;
        await sleep(500 * Math.pow(2, attempt));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}

function formatResults(hits: SearchHit[], query: string, source: string): string {
  const lines: string[] = [
    `Search results for: "${query}" (via ${source})`,
    `Found ${hits.length} result(s)`,
    '',
  ];
  hits.forEach((h, i) => {
    lines.push(`[${i + 1}] ${h.title}`);
    lines.push(`    URL: ${h.url}`);
    if (h.snippet) lines.push(`    ${truncate(h.snippet, 240)}`);
    lines.push('');
  });
  return lines.join('\n').trim();
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}
