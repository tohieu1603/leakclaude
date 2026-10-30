// WebFetch helpers: URL validation, HTML→text, caching, redirect detection.
// Mirrors patterns from Claude Code's WebFetchTool/utils.ts: TTL+size-bounded cache,
// max content length, max URL length, manual redirect handling with cross-host detection,
// hard timeout via AbortSignal.

const MAX_URL_LENGTH = 2000;
const MAX_HTTP_CONTENT_LENGTH = 10 * 1024 * 1024; // 10 MiB
export const MAX_MARKDOWN_LENGTH = 100_000;
const FETCH_TIMEOUT_MS = 60_000;
const MAX_REDIRECTS = 10;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_BYTES = 50 * 1024 * 1024; // 50 MiB

// Simple TTL+size-bounded cache. LRU on insert order via Map iteration.
interface CacheEntry { content: string; bytes: number; code: number; codeText: string; expiresAt: number; }
const URL_CACHE = new Map<string, CacheEntry>();
let cacheBytes = 0;

function cacheGet(url: string): CacheEntry | null {
  const entry = URL_CACHE.get(url);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    URL_CACHE.delete(url);
    cacheBytes -= entry.bytes;
    return null;
  }
  return entry;
}

function cachePut(url: string, entry: CacheEntry): void {
  // Evict oldest while over budget
  while (cacheBytes + entry.bytes > MAX_CACHE_BYTES && URL_CACHE.size > 0) {
    const first = URL_CACHE.keys().next().value;
    if (first === undefined) break;
    const ev = URL_CACHE.get(first);
    if (ev) cacheBytes -= ev.bytes;
    URL_CACHE.delete(first);
  }
  URL_CACHE.set(url, entry);
  cacheBytes += entry.bytes;
}

export function clearWebFetchCache(): void {
  URL_CACHE.clear();
  cacheBytes = 0;
}

export interface FetchedContent {
  type: 'content';
  bytes: number;
  code: number;
  codeText: string;
  content: string;
  contentType: string;
}

export interface RedirectDetected {
  type: 'redirect';
  originalUrl: string;
  redirectUrl: string;
  statusCode: number;
}

export type FetchResult = FetchedContent | RedirectDetected | { type: 'error'; message: string };

export function validateURL(url: string): string | null {
  if (url.length > MAX_URL_LENGTH) return `URL too long (max ${MAX_URL_LENGTH} chars)`;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `Invalid URL: ${url}`;
  }
  if (parsed.username || parsed.password) return 'URLs with embedded credentials are not allowed';
  if (parsed.hostname.split('.').length < 2) return `Hostname is not publicly resolvable: ${parsed.hostname}`;
  if (!['http:', 'https:'].includes(parsed.protocol)) return `Unsupported protocol: ${parsed.protocol}`;
  return null;
}

// Manual redirect-following so we can detect cross-host redirects
// (security signal — caller should inform the model rather than silently follow).
export async function fetchUrl(rawUrl: string, signal: AbortSignal): Promise<FetchResult> {
  const cached = cacheGet(rawUrl);
  if (cached) {
    return {
      type: 'content',
      bytes: cached.bytes,
      code: cached.code,
      codeText: cached.codeText,
      content: cached.content,
      contentType: 'text/plain',
    };
  }

  // Normalize http→https
  let url = rawUrl.startsWith('http://') ? 'https://' + rawUrl.slice(7) : rawUrl;
  const originalHost = new URL(url).host;

  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const combined = AbortSignal.any ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let res: Response;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: combined,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentMini-Nest/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/json,*/*;q=0.8',
        },
      });
    } catch (e) {
      return { type: 'error', message: `Network error: ${(e as Error).message}` };
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) return { type: 'error', message: `${res.status} redirect missing Location header` };
      const next = new URL(loc, url).toString();
      const nextHost = new URL(next).host;
      if (nextHost !== originalHost) {
        return { type: 'redirect', originalUrl: rawUrl, redirectUrl: next, statusCode: res.status };
      }
      url = next;
      continue;
    }
    break;
  }
  res = res!;

  if (!res.ok) {
    return { type: 'error', message: `HTTP ${res.status} ${res.statusText} for ${url}` };
  }

  const contentType = res.headers.get('content-type') ?? '';
  const contentLengthHeader = res.headers.get('content-length');
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_HTTP_CONTENT_LENGTH) {
    return { type: 'error', message: `Content too large: ${contentLengthHeader} bytes (max ${MAX_HTTP_CONTENT_LENGTH})` };
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_HTTP_CONTENT_LENGTH) {
    return { type: 'error', message: `Content too large: ${buf.byteLength} bytes (max ${MAX_HTTP_CONTENT_LENGTH})` };
  }

  let content: string;
  if (contentType.includes('application/json')) {
    try {
      content = JSON.stringify(JSON.parse(new TextDecoder().decode(buf)), null, 2);
    } catch {
      content = new TextDecoder().decode(buf);
    }
  } else if (isBinaryContentType(contentType)) {
    return { type: 'error', message: `Binary content type "${contentType}" — not converted. Use Bash with curl/wget if you need to download.` };
  } else {
    content = htmlToText(new TextDecoder().decode(buf));
  }

  if (content.length > MAX_MARKDOWN_LENGTH) {
    content = content.slice(0, MAX_MARKDOWN_LENGTH) + '\n... (truncated)';
  }

  const result: FetchedContent = {
    type: 'content',
    bytes: buf.byteLength,
    code: res.status,
    codeText: res.statusText || 'OK',
    content,
    contentType,
  };

  cachePut(rawUrl, {
    content: result.content,
    bytes: Buffer.byteLength(result.content, 'utf8'),
    code: result.code,
    codeText: result.codeText,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return result;
}

function isBinaryContentType(ct: string): boolean {
  return /^(image|audio|video|application\/(pdf|zip|x-tar|gzip|octet-stream))/i.test(ct);
}

// Lightweight HTML→text — strips script/style, preserves block-level newlines, decodes basic entities.
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<\/(p|div|li|tr|br|h[1-6]|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
