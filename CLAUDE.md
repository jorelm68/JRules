# jrules (this repo)

A Claude Code **plugin + marketplace** that carries the owner's engineering rulebook to every project.
Working on this repo means editing the rulebook itself — the rules in RULES.md apply here too.

Map: [docs/KNOWLEDGE.md](docs/KNOWLEDGE.md) — query with `node scripts/kg.mjs query <id>` / `owner <path>`.

## Layout
- `.claude-plugin/plugin.json`, `marketplace.json` — manifests. No `version` on purpose: the plugin is versioned by
  git commit, so every commit is a release (`claude plugin update` only picks up committed changes).
- `RULES.md` — always-on rules, injected at session start by `hooks/git-pulse.mjs --session`. Every line costs
  tokens in every session of every project: keep it terse; put detail in skills.
- `skills/<name>/SKILL.md` (+ `reference/`, `templates/`) — loaded on demand. Descriptions are always-on; keep them
  short and trigger-focused.
- `scripts/kg.mjs` — knowledge-graph query tool (used by projects via the session digest).
- `agents/` — subagents. `hooks/hooks.json` + `*.mjs` — hooks (Node, no dependencies; must work on Windows).
- `install.mjs` (installs the plugin at user scope), `tools.mjs` (third-party tools), `BOOTSTRAP.md` (manual for
  agents pointed at this repo), `TOOLS.md`.

## Rules for changes
- Stay project-agnostic: no machine paths, usernames, or project names in RULES.md/skills.
- Validate before committing: `claude plugin validate .` and `claude plugin details jrules@jrules` (token cost).
- Test hooks by piping JSON into them (`echo '{"tool_name":"Bash","tool_input":{...},"cwd":"..."}' | node hooks/x.mjs`).
- After merging, reinstall/update: `node install.mjs`.
