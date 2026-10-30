// Search providers. Each provider returns a uniform SearchHit[] or throws.
// Keep network errors typed so the tool can decide retry vs fall through.

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

export class TransientSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientSearchError';
  }
}

const TIMEOUT_MS = 8_000;

export async function searchBrave(query: string, count: number): Promise<SearchHit[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) throw new Error('BRAVE_SEARCH_API_KEY not set');

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(count, 20)));
  url.searchParams.set('safesearch', 'moderate');

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429 || res.status >= 500) {
    throw new TransientSearchError(`Brave returned ${res.status}`);
  }
  if (!res.ok) throw new Error(`Brave error ${res.status}: ${await res.text()}`);

  interface BraveResp {
    web?: { results?: Array<{ title: string; url: string; description?: string }> };
  }
  const data = (await res.json()) as BraveResp;
  return (data.web?.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description ?? '',
  }));
}

export async function searchDuckDuckGo(query: string, count: number): Promise<SearchHit[]> {
  // DDG Instant Answer API — limited but key-free
  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_redirect', '1');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 AgentMini-Nest/1.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429 || res.status >= 500) {
    throw new TransientSearchError(`DDG returned ${res.status}`);
  }
  if (!res.ok) throw new Error(`DDG error ${res.status}`);

  interface DDGResp {
    AbstractText?: string;
    AbstractURL?: string;
    AbstractSource?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }>;
  }
  const data = (await res.json()) as DDGResp;
  const out: SearchHit[] = [];

  if (data.AbstractText && data.AbstractURL) {
    out.push({
      title: data.AbstractSource || 'Abstract',
      url: data.AbstractURL,
      snippet: data.AbstractText,
    });
  }
  for (const topic of data.RelatedTopics ?? []) {
    if (out.length >= count) break;
    if (topic.Text && topic.FirstURL) {
      out.push({
        title: topic.Text.slice(0, 120),
        url: topic.FirstURL,
        snippet: topic.Text,
      });
    }
  }
  return out.slice(0, count);
}

export function applyDomainFilters(
  hits: SearchHit[],
  allowed?: string[],
  blocked?: string[],
): SearchHit[] {
  return hits.filter((h) => {
    let host: string;
    try { host = new URL(h.url).hostname; } catch { return false; }
    if (allowed && allowed.length > 0 && !allowed.some((d) => host.endsWith(d))) return false;
    if (blocked && blocked.some((d) => host.endsWith(d))) return false;
    return true;
  });
}
