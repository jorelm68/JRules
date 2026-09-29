# Knowledge map

<!-- Graph of this repo. Query it instead of reading it: `node scripts/kg.mjs query <id>`, `owner <path>`,
     `check`. The Index is injected at session start. Edited only in the final PR of a task. -->

## Index
- [[rules]] — always-on rules injected every session · `RULES.md`
- [[manifest]] — plugin + marketplace manifests · `.claude-plugin/`
- [[hooks]] — hook wiring and guard/pulse scripts · `hooks/`
- [[kg]] — knowledge-graph query tool · `scripts/kg.mjs`
- [[skills]] — on-demand skills (init, ship, sync, secure, legal, perf, design, council) · `skills/`
- [[agents]] — subagents on cheap model tiers · `agents/`
- [[templates]] — per-project files created by jrules-init · `skills/jrules-init/templates/`
- [[installers]] — plugin install and third-party tools · `install.mjs`, `tools.mjs`
- [[docs]] — human/agent manuals · `README.md`, `BOOTSTRAP.md`, `TOOLS.md`, `CLAUDE.md`

## Nodes

### rules — always-on rules
- **Files:** `RULES.md`
- **Purpose:** git/PR policy, delegation, build standards, council trigger; every line costs tokens in every session.
- **Edges:** injected-by → [[hooks]] · points-to → [[skills]] · points-to → [[agents]] · uses → [[kg]]

### manifest — plugin + marketplace manifests
- **Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- **Purpose:** makes the repo a plugin (`jrules@jrules`); no `version`, so each git commit is a release.
- **Edges:** packages → [[rules]] · packages → [[hooks]] · packages → [[skills]] · packages → [[agents]] · used-by → [[installers]]

### hooks — hook wiring and scripts
- **Files:** `hooks/hooks.json`, `hooks/git-pulse.mjs`, `hooks/guard-git.mjs`, `hooks/guard-secrets.mjs`
- **Purpose:** SessionStart injects rules + git digest + map index; UserPromptSubmit reports git changes only;
  PreToolUse blocks commits/pushes to main and secrets.
- **Edges:** injects → [[rules]] · runs → [[kg]] · used-by → [[skills]]
- **Entry points:** `hooks/git-pulse.mjs` (`--session` vs prompt mode)

### kg — knowledge-graph query tool
- **Files:** `scripts/kg.mjs`
- **Purpose:** `index` / `query <id>` / `owner <path>` / `check` over a project's docs/KNOWLEDGE.md.
- **Edges:** reads → [[templates]] (map format) · used-by → [[hooks]] · used-by → [[skills]]

### skills — on-demand skills
- **Files:** `skills/`
- **Purpose:** jrules-init, ship, sync, secure, legal, perf, design, council; reference files load per section.
- **Edges:** delegates-to → [[agents]] · scaffolds → [[templates]] · uses → [[kg]]

### agents — subagents
- **Files:** `agents/`
- **Purpose:** grunt-worker (Haiku), implementer (Sonnet), council-advisor (Sonnet).
- **Edges:** used-by → [[skills]] · used-by → [[rules]]

### templates — per-project files
- **Files:** `skills/jrules-init/templates/`
- **Purpose:** CLAUDE.md, HANDOFF.md, GOTCHA.md, KNOWLEDGE.md (graph format), PR template, settings.json opt-in,
  security.txt, Dependabot, CI security scan.
- **Edges:** used-by → [[skills]] · format-for → [[kg]]

### installers — install scripts
- **Files:** `install.mjs`, `tools.mjs`
- **Purpose:** install the plugin at user scope (removing the legacy install); install third-party tools.
- **Edges:** installs → [[manifest]] · documented-in → [[docs]]

### docs — manuals
- **Files:** `README.md`, `BOOTSTRAP.md`, `TOOLS.md`, `CLAUDE.md`
- **Purpose:** how to use jrules; BOOTSTRAP is the single-file manual for agents pointed at this repo.
- **Edges:** describes → [[installers]] · describes → [[manifest]]

## Flows
- Session start: [[hooks]] git-pulse → injects [[rules]] + git digest + this Index → Claude queries [[kg]] as needed.
- New project: [[installers]] or settings opt-in → [[skills]] jrules-init → [[templates]] copied into the project.

## Decisions
- Plugin over symlinked ~/.claude install — works in cloud sessions and per-repo opt-in (PR #2).
- Map is queried, not read: only the Index is always in context; nodes load on demand via [[kg]].
