# Third-party tools

What each tool is, whether jrules uses it, and how it's wired in. `node tools.mjs` installs the recommended set
(global, so every project gets it); the commands are listed below if you'd rather run them yourself.

**Token rule:** every installed skill puts its description into every session's context, and overlapping design
skills fire on the same prompts with conflicting advice. So jrules installs **only the specific skills it uses**
from each repo, not whole collections (installing all of taste-skill + Emil's + Vercel's collections would add
~40 skills to every session).

## Design

| Tool | What it does | jrules use | Install |
|---|---|---|---|
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | Anti-"AI slop" design taste (layout variance, motion, density dials) + `redesign-existing-projects` for upgrading existing UI | Aesthetic direction in `/design` | `npx skills add Leonxlnx/taste-skill -s design-taste-frontend -s redesign-existing-projects -a claude-code -g -y` |
| [web-design-guidelines](https://github.com/vercel-labs/agent-skills) (Vercel) | Audits UI code against Vercel's interface guidelines (a11y, forms, focus, motion, typography) | Final audit step in `/design` and `/ship` | `npx skills add vercel-labs/agent-skills -s web-design-guidelines -a claude-code -g -y` |
| [Emil Kowalski's skills](https://github.com/emilkowalski/skills) | `emil-design-eng`: polish, component and animation decisions (easing, durations, what not to animate) | Motion/interaction detail in `/design` | `npx skills add emilkowalski/skills -s emil-design-eng -a claude-code -g -y` |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design process: `/impeccable init`, `craft`, `critique`, `audit`, `polish`, …; reads PRODUCT.md + DESIGN.md | Context setup and deep audits in `/design` | `npx impeccable install`, or in Claude: `/plugin marketplace add pbakaus/impeccable` → `/plugin` → install |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | DESIGN.md files (type, color, spacing, components) for ~60 real brands (Stripe, Linear, Vercel, Notion…) | `/design` fetches one into the project root as the starting design system | nothing to install — `/design` curls the file |
| [SkillUI](https://github.com/amaancoderx/npxskillui) | Reverse-engineers any live site (or repo) into DESIGN.md + tokens; `--mode ultra` adds screenshots/motion via Playwright | `/design` "match this site" path | `npm i -g skillui` (or `npx skillui`) |
| [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) | Claude reads frames, variables, and components from your Figma files | `/design` Figma path → DESIGN.md → build | `claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp`, then `/mcp` → figma → Authenticate |
| **Image to code** | Screenshot a design you like, paste it, Claude recreates it | Built into Claude (vision): `/design` extracts tokens from the image into DESIGN.md first, builds, then compares its own screenshot to yours. taste-skill's `image-to-code` is skipped — it's built around generating images first, which Claude Code can't do | nothing to install |

## Build, test, docs

| Tool | What it does | jrules use | Install |
|---|---|---|---|
| [playwright-cli](https://github.com/microsoft/playwright-cli) | Claude opens the browser, clicks, fills forms, takes screenshots/snapshots | `/design` verify loop; perf traces; checking CSP console errors | `npm i -g @playwright/cli@latest` then `playwright-cli install --skills -g` |
| [Context7](https://github.com/upstash/context7) | Current docs for the exact library versions you use | Global rule: look up APIs instead of coding from memory | `npx ctx7 setup --claude` (OAuth; writes the MCP config) |
| [Supabase plugin](https://supabase.com/docs/guides/ai-tools/plugins) | Supabase skills (RLS, auth, migrations, Postgres best practices) | Loaded when working on Supabase code; `/secure` uses the MCP's security advisors | `claude plugin marketplace add supabase/agent-skills` then `claude plugin install supabase@supabase-agent-skills` |
| Supabase MCP | Manage projects, run SQL, migrations, advisors from Claude | Already connected in your claude.ai connectors; for local Claude Code: | `claude mcp add --transport http --scope user supabase "https://mcp.supabase.com/mcp?read_only=true"` — keep `read_only=true` unless a task needs writes, and scope with `&project_ref=<ref>` |

## Security testing

| Tool | What it does | jrules use | Install |
|---|---|---|---|
| [Strix](https://github.com/usestrix/strix) | Autonomous AI pentest agents that attack your app in a Docker sandbox and report/validate findings | Occasional pre-launch pass, **only against your own app, local or staging** — never production or anything you don't own | Needs Docker. `curl -sSL https://strix.ai/install \| bash` (macOS/Linux/WSL), then `STRIX_LLM=<provider/model> LLM_API_KEY=<key> strix --target ./` or `--target https://staging.yourapp.com`. Costs LLM tokens per run — run it at milestones, not per PR. |
| [security-audit](https://github.com/cloudflare/security-audit-skill) (Cloudflare) | Six-phase multi-agent codebase audit: recon → coverage-led hunting → independent verification → validated `findings.json` + `REPORT.md` | `/secure deep` and "audit/pen-test this codebase"; before launch or a major release. Executes target code only in an OS-enforced sandbox; writes outside the repo | **Bundled in the plugin** (vendored in `skills/security-audit/`, MIT) — nothing to install. Don't also `npx skills add` it, or two copies load. Refresh: `node scripts/sync-vendored.mjs` |
| gitleaks | Finds secrets in git history | CI workflow scaffolded by `/jrules-init`; `/secure` runs it locally if installed | `winget install gitleaks` / `brew install gitleaks` |

## Not wired in (on purpose)

**OmniRoute** ([repo](https://github.com/diegosouzapw/OmniRoute)) is a local AI gateway (`npm i -g omniroute`,
endpoint `http://localhost:20128/v1`) that routes requests across hundreds of providers, including free tiers.
jrules doesn't route Claude Code through it, because:
- **Your code and secrets go to whichever provider it picks.** Free tiers often log or train on prompts; its own
  catalog flags a number of providers as terms-risky. That contradicts the `/secure` rules this repo enforces.
- Claude Code's tool use, hooks, and skills are tuned for Claude models. Weaker models make more mistakes, and
  redoing their work costs more than it saves.
- jrules already cuts cost the safe way: Haiku (`grunt-worker`) for mechanical work, Sonnet (`implementer`,
  `council-advisor`) for routine implementation, diff-scoped audits, and on-demand checklists.

Where it *can* make sense: your app's own backend calls for low-stakes, non-sensitive tasks (e.g. rewriting
public marketing copy), behind a server-side key. Run `/council` before adopting it for anything with user data.

## Keeping them current and safe
- Third-party skills are prompts that run with your permissions — this list sticks to well-known authors. Skim
  what changed before `npx skills update -g`.
- `npx skills ls -g` shows what's installed; `npx skills rm -g <name>` removes one.
