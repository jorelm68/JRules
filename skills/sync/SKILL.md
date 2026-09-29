---
name: sync
description: Git/PR hygiene — audit the previous group of PRs, clean up merged branches and worktrees, and resync after the user merges. Use at the start of new work when the git-pulse digest flags anything (stale branches, red CI, conflicts, merges) or PR status is unknown, whenever git-pulse reports "changes since last check", and when the user says "I merged", "clean up", or "check my PRs".
---

# Sync

Cheap by design: one `grunt-worker` gathers facts, you decide, the worker executes safe cleanup.

## 1. Gather (→ `grunt-worker`, returns a table only)
- `git fetch --prune`, `git status -sb`, `git worktree list`, `git stash list`.
- Local branches with `[gone]` upstream or fully merged into `origin/<default>`.
- PRs: `gh pr list --author @me --state all --limit 15 --json number,title,state,headRefName,mergeable,statusCheckRollup,reviewDecision,mergedAt`
  (no `gh` → use the GitHub MCP tools: list/search pull requests for this repo).
- Unresolved review comments on open PRs (count per PR).

## 2. Audit the previous PR group
For each PR from the last task (HANDOFF "In flight" or the most recent PRs):
- **Merged/closed** → note it; its notes for shared docs must land in the group's final PR.
- **Open + CI red / conflict / changes requested** → fix it now if it's a PR you created (that's work, not
  waiting); otherwise report it.
- **Open + green** → waiting on the user; mention once.
- Overlap check: files touched by 2+ open PRs of the group (`git diff --name-only origin/<default>...origin/<branch>`)
  → move those edits into the final PR.

## 3. Clean up
- **Do without asking:** `git fetch --prune`; `git worktree prune`; switch off a merged branch to the default
  branch and `git pull --ff-only`; delete local branches whose PR is merged or whose upstream is `[gone]` **and**
  whose commits are in the default branch (`git branch -d`; for squash merges confirm via the merged PR first,
  then `-D`).
- **Ask first (one message, batched):** deleting unmerged branches, dropping stashes, closing stale PRs, deleting
  remote branches, removing worktrees with uncommitted changes.

## 4. After a merge
1. Update the default branch locally (`git switch <default> && git pull --ff-only`) and clean up as above.
2. Remaining PRs of the same group: rebase each on the new default branch
   (`git rebase origin/<default>`, then `git push --force-with-lease` — own task branches only), re-run fast checks,
   confirm CI restarts.
3. If the merged PR was the group's final PR, the task is done: HANDOFF is current; nothing else to do.

## 5. Report (≤5 lines)
What merged, what was cleaned, what's open and its state, what needs the user.
