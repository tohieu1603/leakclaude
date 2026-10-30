export const KILL_SHELL_TOOL_NAME = 'KillShell';

export const PROMPT = `Terminates a background bash shell started with Bash(run_in_background:true).

- shellId: the id returned by the original Bash call
- signal: optional, defaults to 'SIGTERM'; pass 'SIGKILL' for stubborn processes

Returns whether a process was actually killed (false if it had already exited).`;
