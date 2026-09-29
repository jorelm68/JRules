---
name: ship
description: Finish a task the jrules way — verify, rebase on main, update shared docs (final PR only), push, and open a PR. Use at the end of every task, or when the user says "ship it", "wrap up", or "open a PR".
---

# Ship

Ask once, if it isn't obvious: **is this the final PR of the task?** (A task split across several PRs — a PR
group — has intermediate PRs that must not touch shared docs or any file another PR in the group touches.)

1. **Branch check.** If on `main`/`master`, move the work to a branch `<type>/<slug>` first.
2. **Verify.** Run the project's lint/typecheck/test/build commands (delegate to `grunt-worker`). Fix or report
   failures — don't ship red silently.
3. **Standards gates** — run only the ones the diff triggers (check `git diff origin/main...HEAD --stat`):
   - auth, API routes/actions, DB/migrations, uploads, webhooks, payments, headers/config → `/secure` audit.
   - sign-up, billing, email sending, analytics/scripts/fonts, new third-party service → `/legal` audit.
   - UI files → `/design` step 3 (screenshots at 390/1440 px, console clean, guidelines audit).
   - new list/data-heavy feature or public page → `/perf` build rules check.
   Fix findings, or list accepted risks in the PR under Verification. None triggered → say "gates: n/a".
4. **Commit** any remaining work in logical commits.
   **PR-group overlap check** (intermediate PRs): compare this branch's files
   (`git diff --name-only origin/main...HEAD`) with each other open PR of the group
   (`git diff --name-only origin/main...origin/<their-branch>`). Any shared file → move that edit to the group's
   final PR (revert it here; note it under "Notes for shared docs").
5. **Rebase** onto the latest main: `git fetch origin && git rebase origin/main`. Resolve conflicts; re-verify if
   anything non-trivial changed.
6. **Shared docs — final PR only.** As the last commit (`docs: update handoff, gotchas, knowledge map`):
   - `HANDOFF.md` — rewrite to reflect the state after this PR merges; fold in notes from earlier PRs of the task.
   - `GOTCHA.md` — add traps discovered during the task; remove ones that no longer apply.
   - `docs/KNOWLEDGE.md` — update nodes/edges/flows and the Index for what the task touched; fix anything that
     misled you; run `kg.mjs check` (path in the session digest) until it passes.
   - `CLAUDE.md` — only if commands, stack, or project rules changed.
   Also apply the edits other PRs of the group deferred (files they shared).
   Intermediate PR: don't touch those files; put the notes under "Notes for shared docs" in the PR body.
7. **Push & PR.** `git push -u origin HEAD`, then `gh pr create` with a body following
   `.github/pull_request_template.md` (what/why, changes, verification, shared-doc notes). Don't merge unless the
   user asks.
8. **Watch the PR** (always, don't ask): subscribe to its activity if the environment supports it; otherwise
   git-pulse reports CI/conflict/merge changes on later prompts. Drive it to green until merged or closed.
9. **Report** the PR link and verification results in two or three lines. When the user merges, the git-pulse
   hook reports it and the `sync` skill handles cleanup and rebasing the rest of the group.
