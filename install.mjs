#!/usr/bin/env node
// Installs JRules into the user-level Claude Code config (~/.claude). Idempotent: re-run after pulling changes.
//   - ~/.claude/CLAUDE.md        imports global/CLAUDE.md (live — edits in JRules apply immediately)
//   - ~/.claude/skills/<name>    junction/symlink to global/skills/<name> (live)
//   - ~/.claude/agents/<name>.md copied from global/agents (re-run after editing agents)
//   - ~/.claude/settings.json    PreToolUse hooks: global/hooks/guard-git.mjs (no commits/pushes to main) and
//                                global/hooks/guard-secrets.mjs (no secrets in frontend code or git)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "global");
const home = path.join(os.homedir(), ".claude");
const posix = (p) => p.replaceAll("\\", "/");
const log = (msg) => console.log(`  ${msg}`);

fs.mkdirSync(home, { recursive: true });
console.log(`Installing JRules from ${root} into ${home}`);

// 1. Global CLAUDE.md import
const claudeMd = path.join(home, "CLAUDE.md");
const importLine = `@${posix(path.join(src, "CLAUDE.md"))}`;
const existing = fs.existsSync(claudeMd) ? fs.readFileSync(claudeMd, "utf8") : "";
if (existing.includes(importLine)) log("CLAUDE.md: import already present");
else {
  fs.writeFileSync(claudeMd, `${importLine}\n${existing ? `\n${existing}` : ""}`);
  log(`CLAUDE.md: added ${importLine}`);
}

// 2. Skills (directory links; junctions need no admin rights on Windows)
const skillsDir = path.join(home, "skills");
fs.mkdirSync(skillsDir, { recursive: true });
for (const name of fs.readdirSync(path.join(src, "skills"))) {
  const target = path.join(src, "skills", name);
  const link = path.join(skillsDir, name);
  let stat = null;
  try { stat = fs.lstatSync(link); } catch {}
  if (stat && !stat.isSymbolicLink()) { log(`skills/${name}: real directory exists — skipped (remove it to link)`); continue; }
  if (stat) fs.rmSync(link, { recursive: false, force: true });
  fs.symlinkSync(target, link, "junction");
  log(`skills/${name} -> ${posix(target)}`);
}

// 3. Agents (copied: single files can't be junctioned on Windows without admin/dev mode)
const agentsDir = path.join(home, "agents");
fs.mkdirSync(agentsDir, { recursive: true });
for (const name of fs.readdirSync(path.join(src, "agents"))) {
  fs.copyFileSync(path.join(src, "agents", name), path.join(agentsDir, name));
  log(`agents/${name} copied`);
}

// 4. Hooks in settings.json
const settingsPath = path.join(home, "settings.json");
const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
const hook = (name) => ({ type: "command", command: `node "${posix(path.join(src, "hooks", name))}"` });
const ours = /guard-(git|secrets)\.mjs/;
settings.hooks ??= {};
const pre = (settings.hooks.PreToolUse ?? [])
  .map((entry) => ({ ...entry, hooks: (entry.hooks ?? []).filter((h) => !ours.test(h.command ?? "")) }))
  .filter((entry) => entry.hooks.length > 0);
pre.push({ matcher: "Bash", hooks: [hook("guard-git.mjs"), hook("guard-secrets.mjs")] });
pre.push({ matcher: "Write|Edit|MultiEdit", hooks: [hook("guard-secrets.mjs")] });
settings.hooks.PreToolUse = pre;
fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
log("settings.json: guard-git + guard-secrets PreToolUse hooks installed");

console.log("Done. Restart Claude Code sessions to pick up changes.");
