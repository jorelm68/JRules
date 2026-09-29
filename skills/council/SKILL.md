---
name: council
description: Pressure-test a decision with five independent advisors (Contrarian, First Principles, Expansionist, Outsider, Executor) and a chairman verdict, instead of agreeing with the user's framing. Use automatically before committing to decisions that are expensive to reverse — stack/vendor, data model, auth, pricing/billing, security or legal trade-offs, large refactors, anything over about a day of work — and whenever the user asks "is this a good idea", "council this", or pushes hard for one option.
---

# Council

One council per decision. Skip for routine implementation or anything cheap to undo.

## 1. Brief (≤200 words, written by you)
Decision to make · context and constraints (stack, users, budget, deadline) · options on the table · what the user
currently favors (label it as their preference, don't argue for it) · what would make it a success. Pull facts from
docs/KNOWLEDGE.md and the Standards profile rather than re-reading code; advisors should not need to explore.

## 2. Advisors — in parallel, one message, five `council-advisor` subagents
Each gets the same brief plus one line: `Role: <Contrarian | First Principles | Expansionist | Outsider |
Executor>`. The roles are defined in the agent itself. Don't add your own opinion to the brief.

## 3. Peer review — only if `/council deep` or the advisors split sharply
One more `council-advisor` with `Role: Reviewer`, given the five answers anonymized as A–E: strongest point,
weakest point, what all five missed.

## 4. Verdict (you, as chairman, ≤250 words)
- **Agree on:** where advisors converge.
- **Clash:** the real disagreements, and which side the evidence favors.
- **Blind spots caught:** things neither you nor the user had raised.
- **Recommendation:** one clear call — say plainly if it differs from what the user wanted, and why.
- **Next step:** one concrete action for today.
Record the decision and its reason in the task's PR notes so it lands in docs/KNOWLEDGE.md → Decisions.
