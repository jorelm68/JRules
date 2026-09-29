---
name: perf
description: Performance standard and audit for web apps — static/CDN rendering, response compression, batched DB writes, optimistic UI, trimmed queries, and finding the single bottleneck in a slow request. Use when building data-heavy features, lists, forms, or public pages; when something "feels slow"; before launch; or when the user asks about latency, scaling, or load.
---

# Perf

Measure first, fix the biggest thing, re-measure. Don't optimize what you haven't measured.

## Build rules (always)
1. **Static by default.** Marketing, landing, docs, legal, and pricing pages are statically generated (SSG/ISR)
   and served from the CDN — not rendered per visitor. Only user-specific routes render dynamically. In Next.js:
   no `cookies()`/`headers()`/nonce in static routes; check the build output marks them static (○). Set
   `Cache-Control` for public API responses that can be cached (`s-maxage`, `stale-while-revalidate`).
2. **Compressed responses.** JSON/HTML/JS go out with brotli or gzip. Vercel/Netlify/Cloudflare do this
   automatically; custom Node/Express servers need `compression()` or a proxy that does it. Verify:
   `curl -sI -H 'Accept-Encoding: br,gzip' <url>` shows `content-encoding`. Also send less: paginate, select only
   needed columns, no `select('*')`.
3. **Batch DB writes.** Never insert/update in a loop with one round trip per row. Use one bulk
   `insert([...rows])`/`upsert([...])`, a single `update ... where id = any($1)`, or a Postgres function via `rpc`
   for multi-step work (also atomic — see `/secure` TOCTOU). Same for reads: no N+1 — join/embed or `in (...)`.
   Index the columns you filter/sort/join on; check with `explain analyze`.
4. **Optimistic UI.** User actions update the UI immediately and reconcile with the server: React
   `useOptimistic`, or TanStack Query `onMutate` (snapshot → apply → rollback in `onError` → `invalidate` in
   `onSettled`). Show a subtle pending state; on failure roll back and show a toast. Not for payments or
   irreversible actions — those wait for the server.
5. **Parallelize independent work** (`Promise.all`), put the app server and database in the same region, stream
   slow sections (Suspense) instead of blocking the page.

## Bottleneck audit (`/perf`, or "it's slow")
1. **Break the round trip into network events.** For the slow action, capture a Playwright trace or the browser
   Network timing (DNS, TLS, request queueing, TTFB, content download), then on the server add `Server-Timing`
   headers (or timed logs) around each step: auth, each DB query, each external API call, rendering.
2. **Find the one span taking most of the time** (often ≥90%): a cross-region DB, an N+1 loop, a cold serverless
   start, an un-indexed query, a slow third-party API, or a waterfall of sequential awaits.
3. **Fix that one** (move region, batch, index, cache, parallelize, move off the request path to a queue), then
   re-measure and report before → after in ms.
Delegate trace collection and log timing extraction to `grunt-worker`; interpret the results yourself.
