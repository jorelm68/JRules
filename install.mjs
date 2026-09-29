#!/usr/bin/env node
// Installs JRules as a Claude Code plugin at user scope, so every project on this machine gets it. Idempotent.
//   node install.mjs            register this clone as the `jrules` marketplace, install/update jrules@jrules
//   node install.mjs --github   register github.com/jorelm68/JRules instead (no local clone needed to update)
// Also removes the pre-plugin install (CLAUDE.md import, skill links, copied agents, settings.json hooks) so
// nothing loads twice. After editing JRules: re-run this (or `claude plugin marketplace update jrules`).
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const home = path.join(os.homedir(), ".claude");
const log = (msg) => console.log(`  ${msg}`);
const run = (cmd) => {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};
const source = process.argv.includes("--github") ? "jorelm68/JRules" : root;

console.log("Removing legacy (pre-plugin) JRules install, if any");
const claudeMd = path.join(home, "CLAUDE.md");
if (fs.existsSync(claudeMd)) {
  const text = fs.readFileSync(claudeMd, "utf8");
  const kept = text.split("\n").filter((l) => !/^@.*JRules\/global\/CLAUDE\.md\s*$/.test(l)).join("\n").replace(/^\n+/, "");
  if (kept !== text) { fs.writeFileSync(claudeMd, kept); log("CLAUDE.md: removed JRules import"); }
}
const skillsDir = path.join(home, "skills");
for (const name of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []) {
  const link = path.join(skillsDir, name);
  try {
    if (fs.lstatSync(link).isSymbolicLink() && /JRules[\\/]global[\\/]skills/.test(fs.readlinkSync(link))) {
      fs.rmSync(link, { force: true });
      log(`skills/${name}: removed legacy link`);
    }
  } catch {}
}
for (const name of fs.readdirSync(path.join(root, "agents"))) {
  const copy = path.join(home, "agents", name);
  if (fs.existsSync(copy)) { fs.rmSync(copy); log(`agents/${name}: removed legacy copy (plugin provides it)`); }
}
const settingsPath = path.join(home, "settings.json");
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  const pre = settings.hooks?.PreToolUse;
  if (pre) {
    const cleaned = pre
      .map((e) => ({ ...e, hooks: (e.hooks ?? []).filter((h) => !/JRules[\\/]global[\\/]hooks/.test(h.command ?? "")) }))
      .filter((e) => e.hooks.length > 0);
    if (JSON.stringify(cleaned) !== JSON.stringify(pre)) {
      settings.hooks.PreToolUse = cleaned;
      fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
      log("settings.json: removed legacy JRules hooks");
    }
  }
}

console.log(`Installing the jrules plugin from ${source}`);
try { execSync("claude --version", { stdio: "ignore" }); } catch {
  console.error("  The `claude` CLI isn't on PATH. Install Claude Code, then re-run.");
  process.exit(1);
}
const known = execSync("claude plugin marketplace list", { encoding: "utf8" });
if (/\bjrules\b/.test(known)) run("claude plugin marketplace update jrules");
else run(`claude plugin marketplace add "${source}"`);
const installed = execSync("claude plugin list", { encoding: "utf8" });
if (/jrules@jrules/.test(installed)) run("claude plugin update jrules@jrules --scope user");
else run("claude plugin install jrules@jrules --scope user");

console.log("Done. Restart Claude Code sessions. Optional third-party tools: node tools.mjs");
