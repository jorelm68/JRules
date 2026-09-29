---
name: design
description: jrules design standard and build-verify loop for web UI — sets up PRODUCT.md/DESIGN.md from a reference (awesome-design-md, a screenshot, a live site via skillui, or Figma), builds with design tokens, then screenshots with playwright-cli and audits against web-design-guidelines. Use before building or restyling any page or component, when the user shares a screenshot/site/Figma link to match, or says "make it look better", "polish", "redesign", or "audit the UI".
---

# Design

Goal: distinctive, consistent, accessible UI — verified by looking at it, not assumed.

## 1. Context before pixels (once per project)
`PRODUCT.md` (audience, purpose, voice, 3 adjectives for the feel) and `DESIGN.md` (tokens: type scale, font
families, color roles incl. dark mode, spacing scale, radii, shadows, motion durations/easings, core component
specs) live in the project root. If missing, create them — ask the user which source, in one message:
- **A brand/site they like** from awesome-design-md: fetch it straight into the root:
  `curl -fsSL -o DESIGN.md https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<brand>/DESIGN.md`
  (browse brands at github.com/VoltAgent/awesome-design-md/tree/main/design-md). Then adapt it — it's a
  reference, not a clone: swap the brand color and logo, keep the system.
- **Any live site:** `npx skillui --url <url> --format design-md --no-skill --out .design-ref` (add
  `--mode ultra` for motion/interaction capture), then distill `.design-ref/**/DESIGN.md` into the root DESIGN.md
  and delete `.design-ref` (don't commit it).
- **A screenshot:** read the image, extract its tokens (type, colors, spacing, radii, component shapes) into
  DESIGN.md first, then build to the tokens; in step 3 compare your screenshot side by side with theirs.
- **Figma:** with the Figma MCP connected, pull the frame's design context/variables into DESIGN.md, then build.
- **Nothing yet:** if Impeccable is installed, `/impeccable init`; else draft DESIGN.md from PRODUCT.md and
  confirm the direction with the user before building pages.

## 2. Build rules (always)
- Use DESIGN.md tokens only (CSS variables / Tailwind theme) — no one-off hex, px, or font values in components.
- Hierarchy through size, weight, and space before color. One accent color. 4/8-px spacing scale. Max ~70ch text.
- Every interactive element has hover, focus-visible, active, disabled; every data view has loading, empty,
  error states. Optimistic UI where it applies (`/perf`).
- Motion: purposeful, 150–300 ms, custom ease-out curves, `transform`/`opacity` only; honor
  `prefers-reduced-motion`; never animate high-frequency actions (typing, keyboard nav).
- Accessibility: semantic HTML, every image has `alt` (`""` if decorative), labels on inputs, `aria-label` on
  icon buttons, WCAG AA contrast, keyboard reachable, 44 px touch targets.
- Responsive from 360 px up; no horizontal scroll; images have width/height (no layout shift); `next/image` or
  equivalent. Fonts self-hosted (`next/font`/Fontsource) — never a Google Fonts `<link>` (`/legal`).
- Avoid AI-slop tells: purple/blue gradients by default, gradient text, glassmorphism everywhere, emoji as icons,
  centered-everything layouts, cards inside cards, identical 3-card feature rows, generic Inter-only type.

## 3. Verify by looking (before calling UI work done)
1. Start the dev server (background), then `playwright-cli open <url>` → `resize 390 844` → `screenshot
   --filename=.screens/<route>-390.png` → `resize 1440 900` → screenshot again (dark mode too if supported).
   Screenshots cost tokens — capture only the changed views; use `playwright-cli snapshot` (accessibility tree)
   for structure/label checks instead of extra screenshots.
2. Look at them critically against DESIGN.md and PRODUCT.md; fix; re-shoot. Max 3 rounds, then report what's left.
3. `playwright-cli console` — no errors or CSP violations. `playwright-cli close` when done.
4. **Audit** changed UI files with `web-design-guidelines` (if installed) and, for a big surface,
   `/impeccable audit`. Fix real findings; skip nits that contradict DESIGN.md.
No playwright-cli installed → say so and ask the user to check the screens; don't claim it looks right.

## Installed-skill precedence (when several fire)
Project DESIGN.md > Impeccable (process: context, critique, audit, polish) > taste-skill (aesthetic direction,
anti-slop) > Emil Kowalski's `emil-design-eng` (motion and interaction detail) > web-design-guidelines (final
compliance audit). Don't run more than one redesign pass on the same surface in one task.
