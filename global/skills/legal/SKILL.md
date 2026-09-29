---
name: legal
description: Legal-risk standard for user-facing apps — Terms of Service, Privacy Policy, cookies, age gate (COPPA), cancel/auto-renewal (ARL/ROSCA), delete account, email unsubscribe (CAN-SPAM), session replay (CIPA), Google Fonts IP leak, DMCA agent, accessibility/alt text, no SMS (TCPA). Use when building sign-up, billing, email, analytics, uploads, or public pages; when adding a third-party service that receives user data; before launch; or when the user asks about lawsuits, ToS, privacy policy, or cookie banners.
---

# Legal

Goal: remove the cheap, common lawsuit triggers by construction. Not legal advice — tell the user once, at launch
readiness, to have a lawyer review the Terms (arbitration, liability cap) and auto-renewal flow.

## Mode 1 — building
Touching one of these? Read that section of `reference/checklist.md` first and build it in:
sign-up/auth → §Age gate, §Consent · billing → §Subscriptions · email → §Email · analytics/scripts/fonts →
§Tracking · uploads/user content → §DMCA · any new third-party service that receives user data → §Privacy policy
(add it to the processor list in the same PR) · any image → alt text (§Accessibility).
Never add phone-number fields or SMS without an explicit user decision (§SMS).

## Mode 2 — audit (`/legal`, pre-launch)
1. **Facts, cheaply.** Read the project CLAUDE.md "Standards profile". Have `grunt-worker` run the scans in
   `reference/checklist.md` §Scans and list: dependencies/env vars naming third-party services, legal routes
   present (`/terms`, `/privacy`, `/cookies`), cancel + delete-account + unsubscribe paths.
2. **Check** each checklist section that applies; mark ✅ / ❌ / N/A with `file:line` evidence.
3. **Fix** ❌ items in code. For missing Terms/Privacy pages, generate them from `templates/terms.md` and
   `templates/privacy.md`: fill placeholders from the facts; the processor table must match what the code
   actually sends data to. Anything you can't infer (legal entity name, address, governing state, DMCA agent),
   ask once in a single message.
4. **Report**: fixed · user actions (register DMCA agent, lawyer review, dashboard toggles) · remaining gaps.
