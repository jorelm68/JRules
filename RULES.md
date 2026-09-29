# JRules — global working agreement

These rules apply to every project (delivered by the JRules plugin, github.com/jorelm68/JRules). A project's own
CLAUDE.md adds project specifics and wins on conflict. Skills and agents named here may appear namespaced as
`jrules:<name>`. Prefer absolute paths; on Windows the Bash tool is Git Bash.

## Task start (every new task or prompt that starts new work)
- The git-pulse digest (injected at session start, and on prompts when something changed) shows branch state,
  stale branches, and open PRs. If it flags anything — or it's missing (no `gh`) — run the **`sync`** skill first:
  audit the previous PR group (CI, conflicts, review comments, merged/closed), then clean up. Nothing flagged →
  start directly; don't spend tokens re-checking.
- `HANDOFF.md` and `GOTCHA.md` are imported by the project CLAUDE.md, so they are already in context — act on them.
- If the project has no `HANDOFF.md`/`GOTCHA.md`/`docs/KNOWLEDGE.md` or no JRules setup, suggest `/jrules-init`.

## Knowledge graph (token budget)
- `docs/KNOWLEDGE.md` is the project's map: nodes (modules, data stores, external services, key concepts) with
  their files, purpose, and edges (depends-on / used-by / writes-to). **Consult it before searching the codebase**
  and jump straight to the files it names. Fall back to Grep/Glob/Explore only for what the map doesn't cover.
- If the map was wrong or missing something you had to discover, note it and fix it in the final PR (see below).

## Delegation (model tiers)
- **`grunt-worker` (Haiku):** file searches, running lint/typecheck/build/tests, log triage, data sanity checks,
  simple mechanical edits.
- **`implementer` (Sonnet):** well-specified implementation once the approach is decided.
- **`Explore`:** broad read-only sweeps across many files when only the conclusion is needed.
- **Keep in the main session:** architecture, data modeling, debugging strategy, design direction, and review of
  subagent output. Give subagents a self-contained brief — they start cold.
- Do tiny tasks (a single read or one-line edit) inline — a cold subagent costs more than it saves.
- Audits (security, legal, design, perf) are scoped to the branch diff unless asked for `full`; mechanical scans
  go to `grunt-worker`, which returns hits only. Screenshots only of changed views.

## Build standards (always on)
Build secure, legally safe, fast, and polished from the first commit — never "fix it before launch". The project
CLAUDE.md "Standards profile" says which apply. Full checklists live in skills; **before writing code in one of
these areas, load that skill's matching section** (not the whole thing):
- **`/secure`** — auth, sessions, APIs, DB/RLS, uploads, webhooks, payments. Non-negotiable: secrets server-only
  and never committed (hook-enforced) · RLS on every table · identity/role from the server session, never from the
  request or client checks · server-side schema validation with whitelisted fields · parameterized SQL · no raw
  user HTML · HttpOnly cookies, server-side sign-out · one generic login error · rate limits + bot protection on
  auth and costly endpoints · signed webhooks · atomic check-and-act (no TOCTOU) · strict headers, CSP without
  `unsafe-inline` scripts · no stack traces to clients · explicit CORS origins.
- **`/legal`** — sign-up, billing, email, analytics, uploads, new data processors. Age gate, cancel button, delete
  account, one-click unsubscribe, renewal disclosure, self-hosted fonts, no session replay/pixels, cookie
  disclosure, privacy policy names every processor. Never collect phone numbers or send SMS unless the user decides to.
- **`/perf`** — static/CDN pages by default, compressed responses, batched writes, optimistic UI, no `select *`,
  measure before optimizing.
- **`/design`** — build to the project's DESIGN.md tokens; screenshot-check changed UI at mobile + desktop before
  calling it done; alt text on every image; WCAG AA.

## Decisions & docs
- Before committing to anything expensive to reverse (stack/vendor, data model, auth, billing, security/legal
  trade-offs, work > ~1 day), or when the user pushes one option and asks if it's good: run **`/council`** — don't
  just agree. Not for routine work.
- Unsure of a library's current API or version → look it up with Context7 (if connected), don't code from memory.

## Git & GitHub policy
- Never commit or push to `main`/`master`. Start every task on a branch: `<type>/<short-slug>`
  (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`). A hook blocks commits/pushes to the default branch.
- Commit in small, logical steps with clear messages. Every task ends with a pushed branch and an open PR (`/ship`).
- **PR groups (several PRs from one task/prompt):** plan them up front — list the files each PR will touch. Any
  file touched by more than one PR in the group, plus the shared docs (`HANDOFF.md`, `GOTCHA.md`,
  `docs/KNOWLEDGE.md`, `CLAUDE.md`), is edited **only in the group's final PR**. Intermediate PRs stay independent
  (mergeable in any order) and put their notes in the PR description. The final PR is opened last, rebased on the
  latest `main` after the others merge, and does the shared edits as its last commit. `/ship` checks overlap.
- **Always watch every PR you open** until it's merged or closed: subscribe to its activity when the environment
  supports it (e.g. `subscribe_pr_activity` in cloud sessions), otherwise rely on git-pulse and re-check at each
  prompt. Fix red CI and conflicts on your own PRs, address review comments, and don't ask whether to watch.
- **After a merge** (git-pulse reports it, or the user says they merged): run the `sync` skill's after-merge
  steps — update local `main`, delete merged branches, rebase remaining PRs of the group, re-check their CI.
- **Clean up as you go:** merged/gone branches, prunable worktrees, and superseded PRs you created. Ask before
  deleting anything unmerged, dropping stashes, or closing PRs you didn't open.
- Never force-push a shared branch (`--force-with-lease` on your own task branch after a rebase is fine), never
  merge your own PR unless the user asks, never skip hooks.

## Shared doc formats
- `HANDOFF.md` — current state for the next session: what's done, what's in flight (open PRs/branches), next steps,
  open questions. Rewrite it, don't append a diary; keep it under ~60 lines.
- `GOTCHA.md` — non-obvious traps: one bullet each, `**Area:** symptom → cause → what to do`. Remove entries that
  no longer apply.
- `docs/KNOWLEDGE.md` — the knowledge graph above. Update nodes/edges touched by the task; keep entries terse.

## Reporting
- Report outcomes faithfully: if tests fail or a step was skipped, say so.
