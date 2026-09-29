# jrules

My engineering rulebook for Claude Code, packaged as a **Claude Code plugin** (with its own marketplace). One
source of truth for how every project is built: git/PR discipline, security, legal risk, performance, and design.
Set a project up once; after that, prompts don't need to repeat any of it.

## What's in it

| Part | Where | What it does |
|---|---|---|
| **Always-on rules** | `RULES.md` | Git/PR policy (incl. PR groups and cleanup), delegation to cheap models, build standards. Injected at session start (~1.4k tokens total always-on). |
| **Skills** (on demand) | `skills/` | `jrules-init` (set up a repo) · `ship` (verify, gates, PR) · `sync` (audit PRs, clean up, resync after merges) · `secure` · `security-audit` (Cloudflare's multi-agent codebase audit, vendored) · `legal` · `perf` · `design` · `council` |
| **Agents** | `agents/` | `grunt-worker` (Haiku: scans, tests, mechanical edits) · `implementer` (Sonnet) · `council-advisor` (Sonnet) |
| **Hooks** (hard guarantees) | `hooks/` | `guard-git`: no commits/pushes to `main` · `guard-secrets`: no secrets in frontend code or git · `git-pulse`: git/PR digest at session start, and on later prompts only when something changed (merge, closed PR, red CI) |
| **Per-project templates** | `skills/jrules-init/templates/` | CLAUDE.md (+ Standards profile), HANDOFF.md, GOTCHA.md, docs/KNOWLEDGE.md, PR template, `.claude/settings.json`, security.txt, Dependabot, CI security scan |
| **Third-party tools** | `tools.mjs`, [TOOLS.md](TOOLS.md) | Design skills, playwright-cli, Context7, Supabase, Figma MCP |

## Using it

**1. On your machine (once)** — every project you open gets jrules:
```bash
git clone https://github.com/jorelm68/jrules && cd jrules
node install.mjs     # installs the plugin at user scope (and removes the old pre-plugin install)
node tools.mjs       # optional third-party tools (--dry-run to preview)
```

**2. In each repo (new or existing)** — open Claude Code in it and run `/jrules-init` (or `/jrules:jrules-init`).
It scaffolds the per-project files and commits `.claude/settings.json` pointing at this repo, so the project
carries jrules with it: cloud sessions, other machines, and collaborators get the plugin automatically.

**3. Anywhere else (no install)** — tell Claude: *"Set this repo up with jrules — follow BOOTSTRAP.md in
github.com/jorelm68/jrules."* [BOOTSTRAP.md](BOOTSTRAP.md) is the single-file manual; it also covers non-Claude
agents (copy RULES.md as AGENTS.md — a snapshot that won't auto-update).

The repo is public, so any machine or cloud session can fetch the plugin without extra access.

## Updating the rules

Edit, commit, push. The plugin is versioned by git commit (no manual version bumps). Then:
- this machine: `node install.mjs` (or `claude plugin marketplace update jrules && claude plugin update jrules@jrules`)
- projects: pick up changes on their next plugin update.

A project's own CLAUDE.md wins on conflicts; a project `.claude/agents/<same-name>.md` overrides a jrules agent.

## End of every task

`/ship` — verify, run the standards gates the diff triggers, check PR-group file overlap, rebase, update shared
docs (final PR of a group only), push, open a PR. When you merge, git-pulse notices and `sync` cleans up.
