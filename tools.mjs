#!/usr/bin/env node
// Installs the third-party tools JRules skills rely on (see TOOLS.md), globally for every project.
// Idempotent: re-running re-installs/updates. Usage:
//   node tools.mjs              install everything
//   node tools.mjs design docs  install only these groups (design, browser, docs, supabase, figma)
//   node tools.mjs --dry-run    print the commands without running them
import { execSync } from "node:child_process";

const GROUPS = {
  design: [
    "npx -y skills add Leonxlnx/taste-skill -s design-taste-frontend -s redesign-existing-projects -a claude-code -g -y",
    "npx -y skills add vercel-labs/agent-skills -s web-design-guidelines -a claude-code -g -y",
    "npx -y skills add emilkowalski/skills -s emil-design-eng -a claude-code -g -y",
    "npx -y skills add pbakaus/impeccable -s impeccable -a claude-code -g -y",
    "npm install -g skillui",
  ],
  browser: ["npm install -g @playwright/cli@latest", "playwright-cli install --skills -g"],
  supabase: [
    "claude plugin marketplace add supabase/agent-skills",
    "claude plugin install supabase@supabase-agent-skills",
  ],
  // Interactive (OAuth in the browser) — run in a normal terminal.
  docs: ["npx -y ctx7 setup --claude"],
  figma: ["claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp"],
};
const AFTER = {
  figma: "In Claude Code run /mcp → figma → Authenticate.",
  supabase: 'Optional MCP: claude mcp add --transport http --scope user supabase "https://mcp.supabase.com/mcp?read_only=true"',
};

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const picked = args.filter((a) => !a.startsWith("--"));
const unknown = picked.filter((g) => !GROUPS[g]);
if (unknown.length) {
  console.error(`Unknown group(s): ${unknown.join(", ")}. Groups: ${Object.keys(GROUPS).join(", ")}`);
  process.exit(1);
}
const groups = picked.length ? picked : Object.keys(GROUPS);

const failed = [];
for (const group of groups) {
  console.log(`\n== ${group}`);
  for (const cmd of GROUPS[group]) {
    console.log(`$ ${cmd}`);
    if (dry) continue;
    try {
      execSync(cmd, { stdio: "inherit", shell: true });
    } catch {
      failed.push(cmd);
      console.log("  ↳ failed — continuing");
    }
  }
  if (AFTER[group]) console.log(`  next: ${AFTER[group]}`);
}

console.log(failed.length ? `\nFailed (run manually, see TOOLS.md):\n  ${failed.join("\n  ")}` : "\nAll done.");
console.log("Restart Claude Code sessions to load new skills. Strix and gitleaks are manual — see TOOLS.md.");
process.exit(failed.length ? 1 : 0);
