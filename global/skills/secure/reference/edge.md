# Edge: headers, CSP, HTTPS, cookies, DNS, WAF

Maps to common scanner findings (UpGuard, Mozilla Observatory, securityheaders.com). Code/config fixes go in the
repo; DNS/WAF/dashboard steps go in the report as "needs user action".

## CSP without `'unsafe-inline'` (UpGuard: "CSP implemented unsafely")
- `script-src` must not contain `'unsafe-inline'` or `'unsafe-eval'` (dev only). Use a **nonce** (dynamic pages)
  or **hashes** (static pages).
- Next.js (App Router): generate a nonce per request in `middleware.ts`, set it on both the request header and
  the response `Content-Security-Policy`; Next applies it to its own scripts. Read it with `headers()` for your
  own `<Script nonce>`. Nonces force dynamic rendering — so keep static marketing pages on a hash-based or
  no-inline-script CSP (`script-src 'self'`; Next `experimental.sri`, Astro CSP hashing) and use nonces for app
  routes. Don't make the landing page dynamic just for a nonce.
- Starting policy (add only the third parties you actually use):
  ```
  default-src 'self'; script-src 'self' 'nonce-{N}' 'strict-dynamic'; style-src 'self' 'nonce-{N}';
  img-src 'self' data: blob: https://<project>.supabase.co; font-src 'self'; object-src 'none';
  connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co https://api.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
  ```
  If server-rendered `style=""` attributes break under a strict `style-src`, allowing `'unsafe-inline'` for
  **styles only** is an accepted, documented risk; never for scripts.
- Roll out with `Content-Security-Policy-Report-Only` first if the app has many third parties; then enforce.
- Verify: Playwright console shows no CSP violations on key pages; re-run the scanner.

## Other headers (set globally, e.g. `next.config` `headers()` or host config)
`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (add `preload` + submit to
hstspreload.org only when every subdomain is HTTPS) · `X-Content-Type-Options: nosniff` ·
`Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()`
(loosen per feature) · `X-Frame-Options: DENY` (legacy twin of `frame-ancestors`) ·
`Cross-Origin-Opener-Policy: same-origin` · remove `X-Powered-By` (Next: `poweredByHeader: false`).

## HTTPS enforced
Host redirects HTTP→HTTPS (Vercel/Netlify/Cloudflare do by default — verify with `curl -sI http://domain`) + HSTS
above + `upgrade-insecure-requests`. No mixed content. Supabase/Stripe URLs are `https://`/`wss://` only.

## Cookies that can't be stolen via XSS/CSRF
Session cookies: `HttpOnly; Secure; SameSite=Lax; Path=/`, no `Domain` — ideally `__Host-` prefixed. XSS is
blocked by output escaping + the CSP above; CSRF by SameSite + Origin checks (`checklist.md` §Auth).

## DNS: CAA record (UpGuard: "CAA not enabled") — user action
Add at the apex, listing only the CAs your host uses:
`example.com. CAA 0 issue "letsencrypt.org"` (Vercel/Netlify use Let's Encrypt; check your host's docs) and
`example.com. CAA 0 iodef "mailto:security@example.com"`. On Cloudflare with Universal SSL, it adds the CAA
records it needs once any CAA record exists — verify certificates still renew after adding.

## WAF + DDoS (UpGuard: "No website application firewall") — user action
Pick one, don't stack proxies: **Vercel Firewall** (if hosted on Vercel: enable managed rules, bot protection,
and attack challenge mode during incidents) or **Cloudflare** proxy (orange cloud; free plan includes DDoS
mitigation and a managed ruleset; add rate-limiting rules for `/login`, `/api/*`). Combine with static landing
pages (`/perf`) so floods hit the CDN cache, not your server or database.

## security.txt (UpGuard: "Security.txt file is missing")
Serve `/.well-known/security.txt` (RFC 9116; `/jrules-init` scaffolds it):
```
Contact: mailto:security@example.com
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: en
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security
```
`Expires` must be < 1 year out — put renewing it in HANDOFF/GOTCHA.

## Email address exposure (UpGuard: info)
Publish role aliases (`support@`, `security@`, `privacy@`) or a contact form — never a personal inbox. Harmless
once it's an alias; don't add obfuscation JS that the CSP then has to allow.
