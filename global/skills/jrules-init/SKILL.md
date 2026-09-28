---
name: jrules-init
description: Scaffold or retrofit a project with the JRules standard — CLAUDE.md, HANDOFF.md, GOTCHA.md, docs/KNOWLEDGE.md, PR template, git repo, GitHub remote and branch rules. Use when starting a new project, when a project is missing these files, or when the user says "set up JRules here".
---

# JRules project init

Templates live next to this file in `templates/`. Work in the current project root. Never overwrite an existing
file — for files that already exist, merge the missing JRules pieces in and show the user what changed.

## 1. Understand the project
- If there is existing code, get a picture of it cheaply (package manifests, README, top-level tree; use `Explore`
  for anything broad). If the folder is empty, ask the user in one message: project name, one-line purpose, stack.

## 2. Git
- `git init -b main` if not a repo. If on `main` with uncommitted work, stop and ask how to proceed.
- Create a branch `chore/jrules-init` for the scaffolding (for a brand-new empty repo, make one initial commit on
  `main` with just a README first, so `main` exists to open a PR against).

## 3. Files (from `templates/`, filling every `{{placeholder}}`)
- `CLAUDE.md` — project name, purpose, stack, commands, project rules. Keep the `@HANDOFF.md` / `@GOTCHA.md`
  imports at the top. If a CLAUDE.md exists, add only the imports and anything clearly missing; don't restate
  global JRules rules (they load from `~/.claude/CLAUDE.md` automatically).
- `HANDOFF.md`, `GOTCHA.md` — seed with what you actually know; empty sections are fine.
- `docs/KNOWLEDGE.md` — for existing code, build a real first map (delegate the sweep to `Explore` and write the
  map yourself from its report). For an empty project, leave the skeleton.
- `.github/pull_request_template.md`.
- If the project defines `.claude/agents/` with the same names as the global ones (`grunt-worker`, `implementer`),
  tell the user the project copies override the global ones and offer to delete them if they're identical in intent.

## 4. GitHub (ask before each outward action)
- If there's no remote: offer `gh repo create <name> --private --source . --remote origin`.
- Push the branch and open the PR with `gh pr create --fill` (or a written body).
- Offer to protect `main` so PRs are required. Use a ruleset:
  `gh api -X POST repos/{owner}/{repo}/rulesets --input <json>` with
  `{"name":"main","target":"branch","enforcement":"active","conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},"rules":[{"type":"deletion"},{"type":"non_fast_forward"},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false}}]}`.
  Private repos on a free GitHub plan can't enforce rulesets — if the API refuses, say so; the local JRules git hook
  still blocks commits/pushes to `main`.
- Offer to enable "Automatically delete head branches": `gh repo edit --delete-branch-on-merge`.

## 5. Report
List files created/changed, the PR link, and anything skipped.
