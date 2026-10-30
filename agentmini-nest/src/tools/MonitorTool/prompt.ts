export const MONITOR_TOOL_NAME = 'Monitor';

export const PROMPT = `Wait for new output from a background shell, or until it exits, or until a timeout. Use this instead of polling BashOutput in a sleep loop.

- shellId: id of the background shell to watch
- timeoutMs: maximum time to wait (default 30000, max 600000)
- untilPattern: optional regex; resolves as soon as a matching line appears
- untilExit: when true (default), resolves as soon as the shell exits

Returns the new output captured during the wait plus the reason it returned (exited / matched / timed_out).`;
