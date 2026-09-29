<!-- jrules Privacy Policy template. Fill every {{placeholder}} from what the code actually does; the processor
     table must list every service that receives user data. Delete [if ...] parts that don't apply.
     Not legal advice — have a lawyer review before launch. -->

# Privacy Policy

_Effective: {{YYYY-MM-DD}}_

{{Legal entity name}} ("we", "us") operates {{App name}} (the "Service"). This policy explains what personal data
we collect, why, where it goes, and your choices. Contact: {{privacy email}}, {{postal address}}.

## What we collect
- **Account data:** email address, {{name}}, hashed password (handled by our auth provider), and the date you
  confirmed you meet our minimum age. We don't store your date of birth.
- **Content you provide:** {{what users create/upload}}.
- **Payment data [if paid]:** processed by Stripe. We receive your subscription status, billing country, and the
  last 4 digits and brand of your card — never the full card number.
- **Usage and device data:** IP address, browser type, pages visited, and timestamps in server logs, kept for
  {{30}} days for security and debugging. {{Analytics: "We use cookieless analytics ({{provider}}) that doesn't
  identify you." / none}}
- **Communications:** emails you send us, and whether you opened our product emails [if tracked].
- **We do not collect phone numbers or send text messages.** We do not use session-recording tools.

## How we use it (and legal bases for EU/UK users)
To provide and secure the Service (contract; legitimate interests in security) · to process payments (contract) ·
to send service emails like receipts and password resets (contract) · to send product news if you opted in
(consent — unsubscribe anytime) · to comply with law (legal obligation). We don't sell or "share" personal data for
cross-context behavioral advertising, and we don't use it to train AI models {{unless: ...}}.

## Where your data goes (service providers)
We share data only with providers that process it on our behalf under contracts:

| Provider | Purpose | Data | Location |
|---|---|---|---|
| Supabase | Database, authentication, file storage | Account data, content | {{region, e.g. United States}} |
| Stripe [if paid] | Payments and subscriptions | Email, billing details, payment method | United States / global |
| {{Vercel / host}} | Hosting and server logs | IP address, request logs | {{region}} |
| {{Resend / email provider}} | Sending email | Email address, email content | {{region}} |
| {{Sentry}} [if used] | Error monitoring | Technical data, user id | {{region}} |
| {{Analytics provider}} [if used] | Aggregate usage stats | Pseudonymous usage data | {{region}} |
| {{AI provider}} [if used] | {{feature}} | {{content sent}} | {{region}} |

We may also disclose data if required by law, to protect rights and safety, or as part of a merger or acquisition
(with notice to you).

## International transfers
Our providers may process data in the United States and other countries. Where required, transfers rely on
safeguards such as Standard Contractual Clauses.

## Retention
Account data and content: until you delete your account, then removed within {{30}} days (backups roll off
within {{N}} days). Invoices and tax records: kept as long as the law requires (typically 7 years). Logs:
{{30}} days.

## Your rights and choices
- **Delete your account:** Settings → Delete account (deletes your data from our systems and providers above).
- **Access, export, or correct** your data: Settings → {{Account}}, or email {{privacy email}}.
- **Email:** every marketing email has a one-click unsubscribe link.
- **Cookies:** see below.
- EU/UK users may also object to or restrict processing and complain to their data protection authority.
  California residents have the right to know, delete, correct, and opt out of sale/sharing (we don't sell or
  share), and we won't discriminate for exercising these rights. We respond within the time the law requires.

## Cookies
We use only essential cookies needed to run the Service:

| Cookie | Purpose | Duration |
|---|---|---|
| `sb-*-auth-token` | Keeps you signed in (Supabase Auth) | Session / up to {{N}} days |
| {{consent / csrf cookie}} | {{purpose}} | {{duration}} |

[if any non-essential cookies] We use {{name}} for {{purpose}} only if you accept it in the cookie banner; you can
change your choice anytime via "Cookie settings" in the footer.

## Children
The Service is not for anyone under {{MIN_AGE}}. We don't knowingly collect data from children; if we learn we
have, we delete it. Contact {{privacy email}} if you believe a child has given us data.

## Security
We use encryption in transit (HTTPS), access controls including row-level security in our database, and hashed
passwords. No system is perfectly secure; we will notify you of a breach affecting your data as the law requires.

## Changes
We will post updates here and email you about material changes before they take effect.
