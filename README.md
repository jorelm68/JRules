# JRules

One source of truth for how Claude Code works across all my projects.

## How it's layered

| Layer | Where | Applies to | Updates |
|---|---|---|---|
| **Global rules** — git/PR policy, delegation, shared-doc rules, knowledge-graph usage | `global/CLAUDE.md` → imported by `~/.claude/CLAUDE.md` | every project, automatically | live |
| **Subagents** — `grunt-worker` (Haiku), `implementer` (Sonnet) | `global/agents/` → copied to `~/.claude/agents/` | every project | re-run `install.mjs` |
| **Skills** — `/jrules-init`, `/ship` | `global/skills/` → linked into `~/.claude/skills/` | every project | live |
| **Enforcement** — hook blocking commits/pushes to `main` | `global/hooks/guard-git.mjs` → `~/.claude/settings.json` | every project | live |
| **Per-project files** — CLAUDE.md, HANDOFF.md, GOTCHA.md, docs/KNOWLEDGE.md, PR template | `global/skills/jrules-init/templates/` | created in each repo by `/jrules-init` | per project |
| **GitHub rules** — require PRs to `main` | GitHub ruleset, set by `/jrules-init` | each repo | per repo |

Rules in CLAUDE.md are guidance Claude follows; the hook and GitHub rulesets are the hard guarantees.

## Setup (once per machine)

```bash
node install.mjs
```

## New project

Make the folder, open Claude Code in it, run `/jrules-init`. The same command works to retrofit an existing project.

## End of every task

`/ship` — verify, rebase on main, update shared docs (final PR of the task only), push, open a PR.

## Changing the rules

Edit files under `global/`, commit and push this repo. Re-run `node install.mjs` only if you changed agents or
added a new skill/hook. Project-level `.claude/agents/<same-name>.md` overrides a global agent; a project's
CLAUDE.md wins on conflicts.
