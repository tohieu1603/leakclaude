export const BASH_TOOL_NAME = 'Bash';

export const DEFAULT_TIMEOUT_MS = 30_000;
export const MAX_TIMEOUT_MS = 600_000; // 10 minutes
export const MAX_OUTPUT_BYTES = 1024 * 200; // 200 KB

export const PROMPT = `Executes a given bash command and returns its output.

The working directory persists between commands, but shell state does not. The shell environment is initialized from the user's profile (bash or zsh).

IMPORTANT: Avoid using this tool to run \`cat\`, \`head\`, \`tail\`, \`sed\`, \`awk\`, or \`echo\` commands, unless explicitly instructed or after you have verified that a dedicated tool cannot accomplish your task. Instead, use the appropriate dedicated tool as this will provide a much better experience for the user:

 - Read files: Use Read (NOT cat/head/tail)
 - Edit files: Use Edit (NOT sed/awk)
 - Write files: Use Write (NOT echo >/cat <<EOF)

# Instructions
 - If your command will create new directories or files, first use this tool to run \`ls\` to verify the parent directory exists and is the correct location.
 - Always quote file paths that contain spaces with double quotes in your command (e.g., cd "path with spaces/file.txt")
 - Try to maintain your current working directory throughout the session by using absolute paths and avoiding usage of \`cd\`. You may use \`cd\` if the User explicitly requests it.
 - You may specify an optional timeout in milliseconds (up to ${MAX_TIMEOUT_MS}ms / 10 minutes). By default, your command will timeout after ${DEFAULT_TIMEOUT_MS}ms.
 - When issuing multiple commands:
   - If the commands are independent and can run in parallel, the agent will run them in parallel for you when you call the tool multiple times in one turn.
   - If the commands depend on each other and must run sequentially, use a single Bash call with '&&' to chain them together.
 - For git commands:
   - Prefer to create a new commit rather than amending an existing commit.
   - Before running destructive operations (e.g., git reset --hard, git push --force, git checkout --), consider whether there is a safer alternative.
   - Never skip hooks (--no-verify) or bypass signing unless the user has explicitly asked for it.`;
