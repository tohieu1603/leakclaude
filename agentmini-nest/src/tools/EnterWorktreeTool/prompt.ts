export const ENTER_WORKTREE_TOOL_NAME = 'EnterWorktree';

export const PROMPT = `Create an isolated git worktree off the current repository and return its absolute path. Use this when you want to:
- experiment with risky changes without polluting the main checkout
- run a parallel agent task in isolation
- prepare a clean branch from \`main\` for a focused refactor

The worktree lives under \`/tmp/agentmini-worktrees/\` and is on a new branch named \`agentmini/<id>\`. To clean up, call ExitWorktree.

Parameters:
- baseBranch (optional): branch to fork from (default = origin's default branch)

Returns the worktree id and absolute path. Use Bash with cd <path> for subsequent commands inside the worktree.`;
