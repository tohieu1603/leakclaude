export const CRON_CREATE_TOOL_NAME = 'CronCreate';

export const PROMPT = `Schedule a recurring or one-shot agent task. The scheduled task will run in the background at the configured time and execute the prompt you specify using a sub-agent.

Parameters:
- name: human-readable label for the job
- prompt: the instructions the agent should execute when fired
- intervalSeconds: seconds between runs. 0 → fire once at startAt
- startAt (optional): ISO timestamp for the first fire. Default = now + interval

Examples:
- daily code-review summary at 09:00 ICT: intervalSeconds=86400, startAt="2026-05-12T02:00:00Z"
- one-shot in 30 minutes: intervalSeconds=0, startAt="<now+30min>"`;
