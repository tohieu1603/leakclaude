export const EXIT_WORKTREE_TOOL_NAME = 'ExitWorktree';

export const PROMPT = `Remove a git worktree created with EnterWorktree.

- id: worktree id returned by EnterWorktree
- keepBranch (optional): when true, keep the branch alive after removing the worktree (default false; the branch is deleted only if the worktree had no changes)

If the worktree had uncommitted changes, the branch is preserved automatically so work isn't lost. Otherwise both the worktree dir and the branch are removed.`;
