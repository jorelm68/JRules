# JRules — global working agreement

These rules apply to every project. A project's own CLAUDE.md adds project specifics and wins on conflict.
Source of truth: `C:/Users/jorel/JRules` (edit there, never in `~/.claude`).

## Environment
- Windows machine: the Bash tool is Git Bash; prefer absolute paths. Node is available for scripts.

## Session start
- `HANDOFF.md` and `GOTCHA.md` are imported by the project CLAUDE.md, so they are already in context — act on them.
- If the project has no `HANDOFF.md`/`GOTCHA.md`/`docs/KNOWLEDGE.md`, suggest running `/jrules-init`.

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

## Git & GitHub policy
- Never commit or push to `main`/`master`. Start every task on a branch: `<type>/<short-slug>`
  (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`). A hook blocks commits/pushes to the default branch.
- Commit in small, logical steps with clear messages. Every task ends with a pushed branch and an open PR (`/ship`).
- **Shared docs are only edited in the final PR of a task:** `HANDOFF.md`, `GOTCHA.md`, `docs/KNOWLEDGE.md`, and
  `CLAUDE.md`. Intermediate PRs (and parallel sessions/worktrees) never touch them; collect notes in the PR
  description instead. The final PR rebases on the latest `main` first, then updates the shared docs as its last
  commit — this keeps parallel work from conflicting.
- Never force-push a shared branch, never merge your own PR unless the user asks, never skip hooks.

## Shared doc formats
- `HANDOFF.md` — current state for the next session: what's done, what's in flight (open PRs/branches), next steps,
  open questions. Rewrite it, don't append a diary; keep it under ~60 lines.
- `GOTCHA.md` — non-obvious traps: one bullet each, `**Area:** symptom → cause → what to do`. Remove entries that
  no longer apply.
- `docs/KNOWLEDGE.md` — the knowledge graph above. Update nodes/edges touched by the task; keep entries terse.

## Reporting
- Report outcomes faithfully: if tests fail or a step was skipped, say so.
