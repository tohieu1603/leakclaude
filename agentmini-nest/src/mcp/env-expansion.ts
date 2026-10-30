// Expand ${VAR} or $VAR references inside a config string using the current
// process env. Claude Code does this on stdio commands, args and HTTP URLs
// so users can keep secrets out of .mcp.json by referencing env. Missing
// variables are left as-is (no throw) to keep config debuggable.

const RE = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;

export function expandEnvVars(input: string): string {
  return input.replace(RE, (match, braced, plain) => {
    const name = braced ?? plain;
    const v = process.env[name];
    return v ?? match;
  });
}

export function expandObjectStrings<T>(value: T): T {
  if (typeof value === 'string') return expandEnvVars(value) as unknown as T;
  if (Array.isArray(value)) return value.map(expandObjectStrings) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = expandObjectStrings(v);
    return out as unknown as T;
  }
  return value;
}
