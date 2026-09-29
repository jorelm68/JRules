# JRules

One source of truth for how Claude Code works across all my projects.

## How it's layered

| Layer | Where | Applies to | Updates |
|---|---|---|---|
| **Global rules** — git/PR policy, delegation, shared-doc rules, knowledge-graph usage | `global/CLAUDE.md` → imported by `~/.claude/CLAUDE.md` | every project, automatically | live |
| **Build standards** — security, legal, performance, design rules that apply while building | `global/CLAUDE.md` (short always-on rules) + skills (full checklists, loaded only when relevant) | every project | live |
| **Subagents** — `grunt-worker` (Haiku), `implementer` (Sonnet), `council-advisor` (Sonnet) | `global/agents/` → copied to `~/.claude/agents/` | every project | re-run `install.mjs` |
| **Skills** — `/jrules-init`, `/ship`, `/secure`, `/legal`, `/perf`, `/design`, `/council` | `global/skills/` → linked into `~/.claude/skills/` | every project | live |
| **Enforcement** — hooks blocking commits/pushes to `main` (`guard-git`) and secrets in frontend code or git (`guard-secrets`) | `global/hooks/` → `~/.claude/settings.json` | every project | live |
| **Third-party tools** — design skills, playwright-cli, Context7, Supabase, Figma MCP | installed by `tools.mjs`; see [TOOLS.md](TOOLS.md) | every project | re-run `tools.mjs` |
| **Per-project files** — CLAUDE.md (with Standards profile), HANDOFF.md, GOTCHA.md, docs/KNOWLEDGE.md, PR template (with standards gates); web apps also get security.txt, Dependabot, and a secrets/dependency CI scan | `global/skills/jrules-init/templates/` | created in each repo by `/jrules-init` | per project |
| **GitHub rules** — require PRs to `main` | GitHub ruleset, set by `/jrules-init` | each repo | per repo |

Rules in CLAUDE.md are guidance Claude follows; the hooks and GitHub rulesets are the hard guarantees.

## Setup (once per machine)

```bash
node install.mjs   # rules, skills, agents, hooks
node tools.mjs     # third-party design/browser/docs tools (see TOOLS.md; `--dry-run` to preview)
```

## New project

Make the folder, open Claude Code in it, run `/jrules-init`. The same command works to retrofit an existing project.

## Skills

| Skill | When it runs | What it does |
|---|---|---|
| `/secure` | before writing auth/API/DB/upload/webhook/payment code; pre-ship; scanner results | Security checklist (secrets, RLS, sessions, validation, XSS, uploads, webhooks, rate limits, CSP/headers, TOCTOU) + diff-scoped audit |
| `/legal` | sign-up, billing, email, analytics, uploads, new processors; pre-launch | Age gate, cancel/renewal, delete account, unsubscribe, cookies, fonts, session replay, DMCA, alt text, no SMS; Terms + Privacy templates |
| `/perf` | data-heavy features, public pages, "it's slow" | Static pages, compression, batched writes, optimistic UI, bottleneck tracing |
| `/design` | any UI work | PRODUCT.md/DESIGN.md from a reference, token-only build rules, playwright screenshot loop, guidelines audit |
| `/council` | automatically before expensive-to-reverse decisions, or on request | Five advisors (Contrarian, First Principles, Expansionist, Outsider, Executor) + chairman verdict |

Token budget: only a short summary of the standards is always loaded; each skill's checklist sections load
on demand, audits are scoped to the branch diff, and mechanical scans run on Haiku.

## End of every task

`/ship` — verify, run the standards gates the diff triggers, rebase on main, update shared docs (final PR of the task only), push, open a PR.

## Changing the rules

Edit files under `global/`, commit and push this repo. Re-run `node install.mjs` only if you changed agents or
added a new skill/hook. Project-level `.claude/agents/<same-name>.md` overrides a global agent; a project's
CLAUDE.md wins on conflicts.
