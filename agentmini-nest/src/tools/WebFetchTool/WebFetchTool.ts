// WebFetch — fetch a URL, convert to text, return with the model-supplied prompt.
// Mirrors Claude Code's WebFetchTool: input { url, prompt }, redirect detection,
// 15-min cache, hard size + timeout limits, abort-signal support.

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Tool, type ToolCallContext, type ToolResult, ok, err } from '../tool.interface';
import { fetchUrl, validateURL } from './utils';
import { PROMPT, WEB_FETCH_TOOL_NAME } from './prompt';

const inputSchema = z.strictObject({
  url: z.string().url().describe('The URL to fetch content from'),
  prompt: z.string().describe('The prompt to run on the fetched content'),
});

@Injectable()
export class WebFetchTool implements Tool<typeof inputSchema> {
  readonly name = WEB_FETCH_TOOL_NAME;
  readonly prompt = PROMPT;
  readonly schema = inputSchema;
  readonly readOnly = true;
  readonly timeoutMs = 65_000;

  async call(input: z.infer<typeof inputSchema>, ctx: ToolCallContext): Promise<ToolResult> {
    const validation = validateURL(input.url);
    if (validation) return err(validation);

    // Use the caller's signal so client disconnect / engine cancellation propagates
    const result = await fetchUrl(input.url, ctx.signal);

    if (result.type === 'error') return err(result.message);

    if (result.type === 'redirect') {
      const message = `REDIRECT DETECTED: The URL redirects to a different host.

Original URL: ${result.originalUrl}
Redirect URL: ${result.redirectUrl}
Status: ${result.statusCode}

To complete your request, call WebFetch again with these parameters:
- url: "${result.redirectUrl}"
- prompt: "${input.prompt}"`;
      return ok(message);
    }

    return ok(
      `URL: ${input.url}\nPrompt: ${input.prompt}\nHTTP ${result.code} ${result.codeText}; ${result.bytes} bytes; ${result.contentType}\n\n--- Page content ---\n${result.content}`,
    );
  }
}
