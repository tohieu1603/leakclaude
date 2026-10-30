export const MULTI_EDIT_TOOL_NAME = 'MultiEdit';

export const PROMPT = `Performs multiple exact string replacements on a single file in one atomic operation.

Use MultiEdit when you have several edits to make to the same file — it's faster than calling Edit repeatedly and the edits are applied as a single atomic write (all-or-nothing).

Usage:
- You must use your \`Read\` tool at least once in the conversation before editing.
- Edits are applied sequentially in the order provided. Each edit operates on the result of the previous one.
- Each edit follows the same rules as the Edit tool: old_string must be unique unless replace_all=true.
- If ANY edit fails validation, the entire operation aborts and the file is left unchanged.
- This is the preferred way to make many small changes to a single file.`;
