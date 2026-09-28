---
name: ship
description: Finish a task the JRules way — verify, rebase on main, update shared docs (final PR only), push, and open a PR. Use at the end of every task, or when the user says "ship it", "wrap up", or "open a PR".
---

# Ship

Ask once, if it isn't obvious: **is this the final PR of the task?** (A task split across several PRs has
intermediate PRs that must not touch shared docs.)

1. **Branch check.** If on `main`/`master`, move the work to a branch `<type>/<slug>` first.
2. **Verify.** Run the project's lint/typecheck/test/build commands (delegate to `grunt-worker`). Fix or report
   failures — don't ship red silently.
3. **Commit** any remaining work in logical commits.
4. **Rebase** onto the latest main: `git fetch origin && git rebase origin/main`. Resolve conflicts; re-verify if
   anything non-trivial changed.
5. **Shared docs — final PR only.** As the last commit (`docs: update handoff, gotchas, knowledge map`):
   - `HANDOFF.md` — rewrite to reflect the state after this PR merges; fold in notes from earlier PRs of the task.
   - `GOTCHA.md` — add traps discovered during the task; remove ones that no longer apply.
   - `docs/KNOWLEDGE.md` — update nodes/edges/flows the task touched; fix anything that misled you.
   - `CLAUDE.md` — only if commands, stack, or project rules changed.
   Intermediate PR: don't touch those files; put the notes under "Notes for shared docs" in the PR body.
6. **Push & PR.** `git push -u origin HEAD`, then `gh pr create` with a body following
   `.github/pull_request_template.md` (what/why, changes, verification, shared-doc notes). Don't merge unless the
   user asks.
7. **Report** the PR link and verification results in two or three lines.
