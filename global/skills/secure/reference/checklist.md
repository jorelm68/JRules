# Security checklist

Each item: **rule** — how to check → how to fix. Examples assume Next.js + Supabase + Stripe; translate for other
stacks. Read only the sections you need.

## §Secrets
- **No secrets in the frontend.** Only publishable keys (Supabase `sb_publishable_…`/legacy anon key, Stripe
  `pk_…`) may reach the browser. Service-role/secret keys, Stripe `sk_…`/`whsec_…`, AI provider keys: server only.
  — Check: build the app, then search the built client bundle (`.next/static`, `dist/`) for `service_role`,
  `sb_secret_`, `sk_live_`, `sk_test_`, `whsec_`; view-source on the live site and search "key". Any env var with a
  public prefix (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`, `REACT_APP_`, `PUBLIC_`) is public — never put a secret
  behind one. → Move the call to a server route/action/edge function; rotate the key if it ever shipped.
- **No `.env` in git.** `.gitignore` has `.env*` with `!.env.example`. — `git ls-files | grep -i '\.env'`.
  → `git rm --cached`, rotate every key in it, then purge history (below).
- **Purge leaked secrets.** Rotate first. Then `git filter-repo --path .env --invert-paths` (or BFG), force-push
  **with the user's explicit OK**, and ask collaborators to re-clone. Turn on GitHub secret scanning + push
  protection. Run `gitleaks detect` over history.
- JRules' `guard-secrets` hook blocks committing `.env` files, known secret formats, and secret-named public env
  vars — don't bypass it; mark genuine test fixtures with `jrules:allow-secret` on the line.

## §Auth & sessions
- **Server decides who the user is.** Never trust a `userId`, `role`, or `isAdmin` from the body, query, headers, or
  client state. — Search handlers for `userId`/`user_id` read from the request. → Get the user from the verified
  session: Supabase server client `supabase.auth.getUser()` (or `getClaims()`); never `getSession()` to authorize
  on the server (it doesn't re-verify the JWT).
- **Permission checks on the server.** Client-side checks (hiding buttons, route guards) are UX only. Every admin
  page, API route, and server action re-checks role server-side, and RLS enforces it again in the DB. Admin role
  lives in a table/`app_metadata` users can't write — never `user_metadata`.
- **Session storage.** Prefer HttpOnly + Secure + SameSite=Lax cookies; never store tokens in `localStorage`. SSR
  apps use `@supabase/ssr` (cookie-based). Its auth cookie is JS-readable by design so the browser client works →
  the compensating control is a strict nonce/hash CSP (§edge.md) and short JWT expiry. For the highest assurance
  do auth entirely server-side (server actions/route handlers) and set your own HttpOnly cookie.
- **CSRF.** Cookie-authenticated state changes need SameSite=Lax/Strict cookies **and** an Origin check (Next.js
  server actions check Origin vs Host automatically; custom route handlers must check `Origin` themselves or use
  a CSRF token). Never do state changes on GET.
- **Sign-out revokes on the server.** Call `supabase.auth.signOut()` from the server client (revokes the refresh
  token; `{ scope: 'global' }` kills all devices), then clear cookies. Deleting the cookie client-side alone leaves
  the session alive. Keep access-token (JWT) expiry short — it stays valid until it expires.
- **One login error for everything:** "Invalid email or password." Same for sign-up ("Check your email to
  continue") and password reset ("If an account exists, we've sent a link"). Same response time either way.
- **Passwords.** Min length ≥ 8 (prefer 12), no composition rules, check against breached passwords (Supabase
  Auth → leaked password protection where your plan has it; otherwise HIBP k-anonymity range API server-side).
  Supabase/most auth providers hash for you; custom auth = argon2id or bcrypt, never plain/SHA/MD5.
- **Email verification on** (Supabase: Confirm email). No access to paid/sensitive features before it.
- **2FA/OTP.** Offer TOTP MFA (Supabase `auth.mfa.enroll/challenge/verify`); require it for admins and enforce
  `aal2` in RLS for sensitive tables: `(select auth.jwt()->>'aal') = 'aal2'`.
- **Rate limit + bot protection on `/login`, `/signup`, `/reset`, OTP verify.** Supabase has built-in auth rate
  limits (tune in dashboard) and native CAPTCHA (Cloudflare Turnstile/hCaptcha) — turn CAPTCHA on for sign-up and
  sign-in. Custom endpoints: per-IP + per-account limits (e.g. Upstash Ratelimit, edge/WAF rules), lockout backoff.

## §Data access
- **RLS on every table** in exposed schemas (`public`, any schema in the API): `alter table t enable row level
  security;` plus explicit policies per operation. No policy = no access (good default). — Check: Supabase
  advisors, or `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where
  n.nspname='public' and c.relkind='r' and not c.relrowsecurity;`. Every migration that creates a table enables
  RLS in the same migration.
- **Ownership in every policy.** `using ((select auth.uid()) = user_id)` and `with check` for insert/update.
  Views: `with (security_invoker = true)`. Storage: policies on `storage.objects` scoped by bucket + owner folder.
  `security definer` functions: `set search_path = ''`, check the caller inside, and don't expose them unless
  needed.
- **Unpredictable IDs + ownership check.** UUIDs (v4/v7), never sequential ids in URLs; still check ownership —
  unguessable is not authorization.
- **Block field tampering (mass assignment).** Never `update(req.body)`. Parse with a schema that picks only
  writable fields (zod `.pick()`/`.strict()`). In the DB, stop users writing privileged columns:
  `revoke update on profiles from authenticated; grant update (display_name, avatar_url) on profiles to
  authenticated;` or a trigger. Same for `role`, `plan`, `credits`, `stripe_customer_id`, `user_id`.
- **Trim API responses.** Select explicit columns, never `select('*')` into a response; never return other
  users' emails, internal flags, tokens, or hashes. Map DB rows to response DTOs.
- **Encrypt sensitive data.** TLS in transit (§edge.md). At rest: the DB disk is encrypted by the provider; for
  especially sensitive fields (tax ids, tokens for third-party accounts) use app-level AES-256-GCM with the key
  in a server secret, or Supabase Vault for secrets. Don't store what you don't need (card data → Stripe only).

## §Input & output
- **Validate all input on the server** (body, query, params, headers, webhook payloads, file metadata) with a
  schema: types, lengths, formats, enums, numeric ranges. Client validation is UX only. Reject unknown fields.
- **Parameterized queries only.** Query builders (supabase-js, Prisma, Drizzle) or placeholders (`$1`). Never
  build SQL with string concatenation or template literals — including in `rpc`/`.raw`/`sql.unsafe`. Dynamic
  identifiers (sort column) come from an allowlist.
- **Escape user content (XSS).** Render as text (React escapes by default). No `dangerouslySetInnerHTML`,
  `innerHTML`, `v-html`, `{@html}` with user data; if rich text is required, sanitize with DOMPurify
  (server: isomorphic-dompurify) using an allowlist. Validate URLs (`https:` only — no `javascript:`) before using
  them in `href`/`src`. Also escape in emails and PDFs you generate.
- **No `eval`, `new Function`, or template engines with user-controlled templates.**
- **Tokens/IDs** from `crypto.randomUUID()`/`crypto.getRandomValues`, never `Math.random()`.

## §Uploads
- Allowlist types by **content** (magic bytes, e.g. `file-type`), not extension or client MIME. Reject executables
  and server-script types (`.php`, `.jsp`, `.asp(x)`, `.phtml`, `.cgi`, `.sh`, `.exe`, `.html`, `.svg` unless
  sanitized — SVG can carry script).
- Size cap on the server (and in the storage bucket config). Re-encode images (sharp) to strip payloads/EXIF.
- Store in object storage (Supabase Storage **private** bucket / S3), never in the web root or app server disk —
  there it can never execute. Random object names (`<uuid>.<ext>`), owner-scoped paths, RLS/policies on the bucket.
- Serve via short-lived signed URLs, from a separate domain where possible, with `Content-Type` from your
  allowlist, `X-Content-Type-Options: nosniff`, and `Content-Disposition: attachment` for anything not an image.

## §Webhooks & payments
- **Verify signatures** with the raw body: Stripe `stripe.webhooks.constructEvent(rawBody, sigHeader,
  STRIPE_WEBHOOK_SECRET)` (Next.js route: `await req.text()`, not `req.json()`). Reject on failure with 400.
  Same idea for every provider (Supabase auth hooks, Resend, GitHub, Clerk/Svix).
- **Idempotent handlers:** store `event.id` in a table with a unique constraint and insert-first (§TOCTOU); skip
  duplicates. Webhooks can arrive twice and out of order.
- **Never trust price/plan from the client.** Create Checkout Sessions server-side from price IDs you own; grant
  access from the verified webhook (or by re-fetching from Stripe), not from the success-page redirect.

## §Abuse & availability
- Rate limit every public endpoint that writes, sends email, calls a paid API (AI!), or is expensive; cap request
  body size; timeouts on outbound calls.
- Landing/marketing pages static on a CDN (see `/perf`) behind a WAF with DDoS protection (§edge.md) — a static
  page has no origin compute to exhaust.
- Bot protection (Turnstile) on sign-up, login, contact, and any free-trial/AI endpoint.

## §Errors, CORS, admin
- **No stack traces in production.** Clients get a generic message + request id; details go to server logs/Sentry
  (scrub secrets/PII). Framework debug modes off in prod.
- **CORS:** explicit origin allowlist, never `*` with credentials (and avoid `*` at all on authenticated APIs).
- **Admin panel:** server-side auth + role check on every admin route and action, plus RLS; MFA required;
  not "hidden URL". Log admin actions.
- Don't log passwords, tokens, full card data, or session cookies.

## §Race conditions (TOCTOU)
Check-then-act across a gap is exploitable. Make the check and the act one atomic operation. Details and code:
`toctou.md`.

## §Dependencies
- Lockfile committed; `npm audit --omit=dev --audit-level=high` clean (or documented exceptions).
- Dependabot/Renovate enabled (`/jrules-init` scaffolds `.github/dependabot.yml`); merge security updates promptly.
- New dependency = check it's maintained, popular, correctly spelled (typosquats), and actually needed.
- Use current library APIs (Context7) — outdated auth/crypto snippets are a common source of holes.
