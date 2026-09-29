# Mechanical scans (for `grunt-worker`)

Run over the audit scope (changed files by default; whole repo for `full`). Exclude `node_modules`, build output,
lockfiles, and `*.md`. Report hits only, as `file:line — <scan name>`; no raw dumps. Hits are leads, not verdicts —
the main session judges them. Patterns are ripgrep regex, copy them exactly.

- **tracked env files:** `git ls-files | grep -iE '(^|/)\.env' | grep -viE 'example|sample|template'`
- **secret formats:** `rg -n 'sk_live_|sk_test_|rk_live_|whsec_|sb_secret_|service_role|-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-ant-|sk-proj-'`
- **public-prefixed secrets:** `rg -n '(NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_|REACT_APP_|PUBLIC_)[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|WEBHOOK)'`
- **client bundle secrets (after a build):** the "secret formats" pattern over `.next/static`, `dist`, `build`
- **raw HTML rendering:** `rg -n 'dangerouslySetInnerHTML|\.innerHTML\s*=|v-html|\{@html|insertAdjacentHTML'`
- **SQL string building:** ``rg -n '(query|raw|execute|unsafe|sql)\s*\(\s*`[^`]*\$\{'`` and
  `rg -n -i "(select|insert|update|delete)[^;]*['\"]\s*\+"`
- **tokens in localStorage:** `rg -n -i 'localStorage\.(set|get)Item\([^)]*(token|session|jwt|auth)'`
- **user id / role from the request:** `rg -n '(body|query|params|searchParams|headers)[.\[(]\s*(get\()?["'\'']?(user_?id|userId|role|isAdmin|is_admin)'`
- **getSession on the server:** `rg -n 'auth\.getSession\('` — then check whether each file runs server-side
- **whole-body writes:** `rg -n '\.(update|insert|upsert|create)\(\s*(req\.body|body|await req\.json\(\))\s*[,)]'`
- **select \* sent to clients:** `rg -n "select\(\s*['\"]\*['\"]\s*\)"`
- **CORS wildcard:** `rg -n "Access-Control-Allow-Origin['\"]?\s*[:,]\s*['\"]\*|origin:\s*['\"]\*['\"]|cors\(\s*\)"`
- **stack traces to clients:** `rg -n '(err|error)\.stack'` and `rg -n 'json\(\s*\{?\s*(err|error)\s*[,})]'`
- **weak randomness:** `rg -n 'Math\.random\(\)'` — flag only token/id/code uses
- **eval:** `rg -n '\beval\(|new Function\('`
- **unverified webhooks:** files whose path or content matches `webhook` but not `constructEvent|verify|signature`
- **tables without RLS:** in `supabase/migrations/*.sql`, tables from `create table` with no matching
  `enable row level security`
- **unsafe CSP:** `rg -n "unsafe-inline|unsafe-eval"` in middleware, next.config, and host config
- **sensitive logging:** `rg -n -i 'console\.(log|info|error)\([^)]*(password|token|secret|cookie)'`
- **dependency audit:** `npm audit --omit=dev --audit-level=high` (or the pnpm/yarn/bun equivalent) — counts only
- **secret history (if installed):** `gitleaks detect --no-banner --redact`
