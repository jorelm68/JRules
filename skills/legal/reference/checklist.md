# Legal checklist

Each item: what's required → how to build it. US-first, with EU/UK notes where they change the build.

## §Age gate (COPPA; GDPR digital-consent age)
- Pick a minimum age and state it in the Terms: **13** (US floor), **16** if you target the EU/UK without parental
  consent flows, **18** if the app takes payments directly from users or has adult content.
- **Neutral age screen at sign-up:** ask date of birth (or month/year) with no hint of the cutoff — not a
  pre-checked "I'm over 13" box. Under-age → refuse sign-up, don't store the DOB or any data, and set a cookie so
  an immediate retry with a different date is blocked.
- Store only `age_verified_at` (+ the minimum age applied), not the DOB, unless you need it.
- If you learn you hold a child's data, delete it. Never target content at children.

## §Consent at sign-up (clickwrap)
- Next to the sign-up button: "By creating an account, you agree to our [Terms] and [Privacy Policy] and our use
  of essential cookies." (Or an unchecked checkbox for extra strength.) Links open the real pages.
- Record `terms_version` and `accepted_at` per user. Re-prompt on material changes.
- Footer on every page links Terms, Privacy, Cookies (if separate), and contact.

## §Cookies
- **Essential cookies** (auth session, CSRF, consent choice) need no consent but must be disclosed → the
  sign-up line above + a cookie section/page listing each cookie (name, purpose, duration). A small dismissible
  notice ("We use essential cookies to keep you signed in. [Learn more]") is fine and cheap.
- **Non-essential** (analytics with cookies, ads, pixels, session replay) need prior opt-in for EU/UK visitors:
  a banner with **Accept** and **Reject** equally prominent, nothing pre-ticked, scripts not loaded until accepted,
  choice changeable later. "By signing up you agree to cookies" is **not** valid consent for these.
- Cheapest compliant path: essential cookies only + cookieless analytics (e.g. Plausible, Vercel Web Analytics)
  → notice, no consent banner. Adding a non-essential tracker is a `/council` decision.

## §Tracking (CIPA, Google Fonts, pixels)
- **No session replay** (Hotjar, FullStory, LogRocket, Microsoft Clarity, PostHog recordings), chat widgets that
  record, or ad pixels (Meta, TikTok, Google Ads) by default — California Invasion of Privacy Act "wiretap" suits
  target exactly these. If ever needed: load only after consent, mask all inputs, disclose in the privacy policy.
- **Self-host fonts** — loading from `fonts.googleapis.com`/`fonts.gstatic.com` sends visitor IPs to Google (EU
  courts have fined this). `next/font/google` self-hosts at build time (OK); plain `<link>` tags are not. Use
  `next/font` or `@fontsource/*`. Same for other third-party CDNs (unpkg, jsdelivr, gravatar) on public pages.

## §Subscriptions (California ARL, ROSCA, state auto-renewal laws)
- **Before purchase, next to the pay button:** price, billing interval, that it renews automatically until
  cancelled, free-trial end date and post-trial price, and how to cancel. Affirmative consent (clear button text
  like "Start subscription — renews at $X/month" or an unchecked checkbox).
- **Confirmation email** restating those terms and the cancel link.
- **Direct cancel button** in account settings ("Cancel subscription"), online, in as few steps as sign-up — no
  "call us", no forced retention maze (one optional offer max). Stripe Customer Portal satisfies this.
- **Renewal reminders:** email before annual renewals and before a free trial converts (Stripe can send these;
  send 7–21 days ahead). Also email on price changes before they apply.
- The FTC's federal "click-to-cancel" rule was vacated in 2025, but ROSCA and state laws (California ARL and
  others) still require the above — build to them.
- Stripe account activation also expects visible refund policy, cancellation policy, and contact info.

## §Delete account
- Clearly labeled "Delete account" in settings, with a confirmation step (re-auth for safety). No emailing support.
- Server-side job deletes/anonymizes everywhere: app tables (cascade), auth user (Supabase admin
  `auth.admin.deleteUser` — server only), storage objects, email-provider contact, analytics identity; cancel
  the Stripe subscription (keep invoices/tax records you're legally required to keep — say so in the policy).
- Send a confirmation email. Required by GDPR/CCPA rights and by Apple for iOS apps.

## §Email (CAN-SPAM; Gmail/Yahoo bulk-sender rules)
- Every marketing/newsletter email: visible **Unsubscribe** link that works without logging in, plus
  `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers; honor immediately (legal
  max 10 business days); physical postal address in the footer; honest From/subject.
- Keep transactional mail (receipts, password reset) separate from marketing; marketing is opt-in.
- Store an `email_opt_out` flag checked before every marketing send; unsubscribes sync to the email provider.
- Sending domain has SPF, DKIM, DMARC.

## §Privacy policy (where the data goes)
- Must name every processor that receives user data, what it gets, why, and where: e.g. Supabase (database, auth,
  storage — region), Stripe (payments; card data never touches our servers), Vercel/host (hosting, logs), Resend
  or other email provider, Sentry, analytics, AI providers (if user content is sent to them).
- Also: data collected, purposes (and GDPR legal bases), retention, user rights and how to use them (in-app delete,
  export, correct, email opt-out; CCPA: we don't sell/share), children, security, international transfers,
  cookies, changes, effective date, contact.
- Rule: a PR that adds a service receiving user data updates the processor table in the same PR.

## §DMCA
- If users can upload or post content: register a **designated DMCA agent** with the US Copyright Office
  (online, small fee, renew every 3 years — user action), publish the agent's contact and takedown/counter-notice
  process, and a repeat-infringer termination policy (in `templates/terms.md`). Build a takedown path (report
  button or email → admin can remove content).

## §Accessibility
- Every `<img>`/`<Image>` has `alt` (meaningful text, or `alt=""` if decorative); icon-only buttons have
  `aria-label`; WCAG 2.2 AA contrast, keyboard navigable, visible focus, form labels. ADA website suits are common.

## §SMS
- Don't collect phone numbers or send texts (TCPA: $500–$1,500 per message in statutory damages; 10DLC
  registration). Use email + TOTP for 2FA. If the user explicitly wants SMS: `/council` first, then express written
  consent, STOP/HELP handling, quiet hours, and a registered 10DLC campaign.

## §Scans (for `grunt-worker`)
- **Google Fonts / third-party CDNs:** `rg -n 'fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdn\.jsdelivr\.net|gravatar\.com'`
- **replay / pixels:** `rg -n -i 'hotjar|fullstory|logrocket|clarity\.ms|mouseflow|smartlook|session_recording|recordSession|connect\.facebook\.net|fbq\(|analytics\.tiktok|googletagmanager|gtag\('`
- **phone / SMS:** `rg -n -i "type=[\"']tel|phone_?number|twilio|vonage|messagebird|plivo|\bsms\b"`
- **images without alt:** `rg -n -U --pcre2 '<(img|Image)\b(?![^>]*\balt=)[^>]*>'`
- **unsubscribe:** email templates/senders missing `unsubscribe` or `List-Unsubscribe`
- **legal routes & flows:** find `/terms`, `/privacy`, `/cookies` pages; `billingPortal`/cancel; delete-account; age/DOB on sign-up
- **processors:** service names in `package.json` dependencies and `.env.example` variable names
