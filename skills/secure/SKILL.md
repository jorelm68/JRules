---
name: secure
description: Security standard and audit for web apps — auth, sessions, RLS, secrets, input validation, XSS, uploads, webhooks, rate limiting, headers/CSP, TOCTOU. Use BEFORE writing code that touches auth, data access, APIs, payments, uploads, webhooks, or user data, and before shipping such changes. Also when the user says "security check", "secure this", or pastes scanner results (UpGuard, etc.).
---

# Secure

Goal: the app is secure by construction. Apply the rules while writing; audit only what changed.

## Mode 1 — building (before/while writing code)
Read only the sections of `reference/checklist.md` for the areas you're touching (e.g. writing an API route →
§Auth, §Data access, §Input). Apply them as you write. Don't read the whole file for a one-area change.

## Mode 2 — audit (`/secure`, pre-ship, or scanner results)
Keep it cheap and scoped:
1. **Scope.** Default = the branch diff (`git diff origin/main...HEAD --stat`). `/secure full` = whole app.
2. **Mechanical scans → `grunt-worker`** (one brief, returns only hits as `file:line`): run the grep list in
   `reference/scans.md` over the scope, plus the dependency audit (`npm audit --omit=dev --audit-level=high` or
   the project's equivalent).
3. **Judgment review → yourself** for flagged hits and for the diff's auth/data paths, using the matching
   checklist sections. For Supabase projects with the Supabase MCP/plugin connected, also run its security
   advisors (`get_advisors` type `security`) and list tables with RLS disabled.
4. **Scanner results** (UpGuard, Mozilla Observatory, securityheaders.com): map each finding to
   `reference/edge.md` and fix in code/config; list DNS/WAF steps the user must do in their dashboards.
5. **Fix** what's in scope (small, safe fixes directly; anything architectural → propose, and `/council` if it's a
   real trade-off). Never weaken a check to make something pass.
6. **Report** in ≤10 lines: fixed · needs user action (dashboards, key rotation) · accepted risks with reason.

## Hard rules (never negotiable)
- A leaked secret is rotated first, then purged from history — purging alone doesn't un-leak it.
- Offensive tools (Strix, scanners) only against apps the user owns, preferably local/staging.
- Never print secret values in chat, logs, PRs, or commits — refer to them by variable name.
