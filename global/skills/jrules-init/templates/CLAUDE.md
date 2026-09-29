@HANDOFF.md
@GOTCHA.md

# {{Project name}}

{{One-paragraph purpose: what this is, who it's for, what matters most.}}
Global working rules (git/PR policy, delegation, shared docs) come from JRules via `~/.claude/CLAUDE.md`.
Code map: [docs/KNOWLEDGE.md](docs/KNOWLEDGE.md) — consult it before searching.

## Stack
- {{Languages, frameworks, versions, hosting, data stores}}

## Standards profile
<!-- Tells /secure, /legal, /perf, /design which checks apply without re-discovering the stack. Keep current. -->
- Web app: {{yes/no}} · Hosting: {{Vercel/…}} · Auth: {{Supabase Auth/…}} · DB: {{Supabase Postgres/…}}
- Payments: {{Stripe subscriptions / none}} · Email: {{Resend (transactional/marketing) / none}}
- User uploads/content: {{yes/no}} · Minimum user age: {{13/16/18}} · Analytics: {{cookieless X / none}}
- Design: [DESIGN.md](DESIGN.md) · [PRODUCT.md](PRODUCT.md) {{or "not set up — run /design"}}

## Commands
- {{dev / build / lint / typecheck / test commands}}

## Project rules
- {{Project-specific conventions and constraints only — don't repeat the global JRules rules}}
