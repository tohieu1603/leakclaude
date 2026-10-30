export const SLEEP_TOOL_NAME = 'Sleep';

export const PROMPT = `Sleeps for the specified duration. Useful for waiting between polling attempts (e.g. checking a long-running build) or rate-limiting calls. Maximum 60 seconds. Prefer ScheduleWakeup-style approaches in the host harness for waits longer than this.`;
