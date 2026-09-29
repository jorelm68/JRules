# JRules bootstrap — instructions for an AI agent

You were pointed here to set up a project with JRules (github.com/jorelm68/JRules): the owner's standard rules for
git/PR discipline, security, legal risk, performance, and design. Follow the first path that works, then stop.

## Path A — Claude Code (preferred)
1. Merge this into the project's `.claude/settings.json` (keep existing keys) and commit it — it pins JRules to
   the repo, so every machine, collaborator, and cloud session that opens the project gets the plugin:
   ```json
   { "extraKnownMarketplaces": { "jrules": { "source": { "source": "github", "repo": "jorelm68/JRules" } } },
     "enabledPlugins": { "jrules@jrules": true } }
   ```
   (`claude plugin install --scope project` alone writes only `enabledPlugins`, which other machines can't
   resolve — always include the marketplace block.) Then tell the user to restart the session and trust the
   plugin when prompted.
2. In the next session, run the `jrules-init` skill (`/jrules-init` or `/jrules:jrules-init`). It creates the
   per-project files (CLAUDE.md with Standards profile, HANDOFF.md, GOTCHA.md, docs/KNOWLEDGE.md, PR template,
   security.txt, Dependabot, CI security scan) and sets branch protection.
3. Tell the user about optional tools: `node tools.mjs` in a JRules clone (see TOOLS.md).

## Path B — no plugin support (other agents, or the plugin can't be fetched)
1. Copy `RULES.md` from JRules into the project as `AGENTS.md` (or the agent's rules file), with a first line
   `<!-- Source: github.com/jorelm68/JRules RULES.md — update from there, don't edit here -->`.
2. Copy the `skills/` folders the project needs into the agent's skills location (`.claude/skills/` for Claude
   Code), and follow `skills/jrules-init/SKILL.md` by hand.
3. Tell the user this is a snapshot: it won't update when JRules changes, unlike Path A.

## What JRules gives a project
- Always-on rules (RULES.md, injected at session start) and a git/PR digest each session.
- Skills: `jrules-init`, `ship`, `sync`, `secure`, `legal`, `perf`, `design`, `council`.
- Agents: `grunt-worker` (Haiku), `implementer` (Sonnet), `council-advisor` (Sonnet).
- Hooks: no commits/pushes to `main`; no secrets in frontend code or git; git-pulse change alerts.
