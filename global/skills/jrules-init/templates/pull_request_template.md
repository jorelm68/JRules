## What & why
<!-- One or two sentences. -->

## Changes
-

## Verification
<!-- Commands run and results (lint / typecheck / tests / manual check). -->

## Standards gates
<!-- Tick what the diff triggered; write "n/a" otherwise. List accepted risks with a reason. -->
- [ ] Security (`/secure`): auth/data/API/uploads/webhooks/payments reviewed, RLS on new tables
- [ ] Legal (`/legal`): new data collection or processor → privacy policy updated in this PR
- [ ] Design (`/design`): changed screens checked at 390 px + 1440 px, alt text, console clean
- [ ] Perf (`/perf`): static where possible, no per-row writes / N+1, optimistic UI where it applies

## Notes for shared docs
<!-- Intermediate PRs: gotchas, map changes, and handoff notes go here — not into HANDOFF.md / GOTCHA.md /
     docs/KNOWLEDGE.md. The task's final PR folds them in. -->
- [ ] This is the final PR of the task and updates HANDOFF.md / GOTCHA.md / docs/KNOWLEDGE.md
