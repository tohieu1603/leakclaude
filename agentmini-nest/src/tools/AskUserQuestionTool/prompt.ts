export const ASK_USER_QUESTION_TOOL_NAME = 'AskUserQuestion';

export const PROMPT = `Ask the user a clarifying question mid-execution. The user is shown the question and the option labels you provide; the answer is returned to you as a list of labels they selected.

Use this only when:
- the answer cannot be inferred from the codebase via grep / read
- the choice is mutually exclusive enough that picking blindly would force a redo
- you would otherwise be stuck

DO NOT use it for "should I proceed?" approvals — proceed and let the user redirect.

Parameters:
- question: the question text (end with a question mark)
- options: 2–6 choices, each { label, description? }
- multiSelect: when true, the user can pick more than one option (default false)
- timeoutMs: how long to wait for an answer before returning "no answer" (default 5min)

If the user does not answer within the timeout, the tool returns "no answer given"; you should then make a sensible default choice and continue.`;
