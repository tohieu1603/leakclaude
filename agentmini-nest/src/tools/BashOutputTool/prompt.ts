export const BASH_OUTPUT_TOOL_NAME = 'BashOutput';

export const PROMPT = `Reads accumulated output from a background bash shell started with Bash({run_in_background:true}).

- shellId: the id returned by the Bash tool when started in background mode
- stream: 'stdout', 'stderr', or 'both' (default 'both')
- reset: when true, also rewinds the read cursor so the next call sees output from the beginning

Returns whatever new output has appeared since the last call, plus an indicator of whether the shell is still running. Safe to call repeatedly to poll long-running commands (dev server logs, file watchers, test runs).`;
