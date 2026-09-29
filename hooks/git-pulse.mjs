// Git/PR awareness for every session, at near-zero token cost.
//   node git-pulse.mjs --session   SessionStart: inject RULES.md + a compact git/PR digest (always).
//   node git-pulse.mjs             UserPromptSubmit: at most every 10 min, fetch and report ONLY what changed since
//                                  the last check (main advanced, PRs merged/closed/opened). Silent otherwise.
// State lives in <git-common-dir>/jrules-pulse.json (never committed). Works without `gh` (git-only fallback).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SESSION = process.argv.includes("--session");
const THROTTLE_MS = 10 * 60 * 1000;
let input = "";
for await (const chunk of process.stdin) input += chunk;
let cwd = process.cwd();
try { cwd = JSON.parse(input)?.cwd ?? cwd; } catch {}

const sh = (cmd, timeout = 8000) => {
  try {
    return execSync(cmd, { cwd, timeout, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 8 * 1024 * 1024 }).toString().trim();
  } catch {
    return null;
  }
};
const emit = (event, text) => {
  if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
  process.exit(0);
};

const rules = () => {
  if (!SESSION) return "";
  try {
    const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    return fs.readFileSync(path.join(root, "RULES.md"), "utf8");
  } catch {
    return "";
  }
};

const gitDir = sh("git rev-parse --git-common-dir");
if (!gitDir) emit("SessionStart", rules()); // not a repo: rules only (prompt mode emits nothing)
const statePath = path.resolve(cwd, gitDir, "jrules-pulse.json");
let state = {};
try { state = JSON.parse(fs.readFileSync(statePath, "utf8")); } catch {}
if (!SESSION && Date.now() - (state.checkedAt ?? 0) < THROTTLE_MS) process.exit(0);

const hasRemote = !!sh("git remote get-url origin");
if (hasRemote) sh("git fetch --prune --quiet origin", 15000);
const base = (sh("git symbolic-ref --short refs/remotes/origin/HEAD") ?? "origin/main").replace(/^origin\//, "");
const baseRef = sh(`git rev-parse --verify -q origin/${base}`) ? `origin/${base}` : base;
const baseSha = sh(`git rev-parse ${baseRef}`);

// PRs via gh when available and authenticated; otherwise null (git-only).
const ghJson = (args) => {
  const out = sh(`gh pr list ${args} --json number,title,headRefName,state,mergeable,reviewDecision,statusCheckRollup`, 10000);
  try { return out ? JSON.parse(out) : null; } catch { return null; }
};
const openPRs = hasRemote ? ghJson("--author @me --state open --limit 20") : null;
const prLine = (p) => {
  const checks = p.statusCheckRollup ?? [];
  const failing = checks.some((c) => ["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED"].includes(c.conclusion ?? c.state));
  const pending = checks.some((c) => (c.status && c.status !== "COMPLETED") || c.state === "PENDING");
  const ci = failing ? "CI red" : pending ? "CI running" : checks.length ? "CI green" : "no CI";
  const conflict = p.mergeable === "CONFLICTING" ? " · CONFLICT" : "";
  const review = p.reviewDecision === "CHANGES_REQUESTED" ? " · changes requested" : "";
  return `#${p.number} ${p.title} (${p.headRefName}) — ${ci}${conflict}${review}`;
};

const lines = [];
if (SESSION) {
  const branch = sh("git branch --show-current") || "(detached)";
  const dirty = (sh("git status --porcelain") ?? "").split("\n").filter(Boolean).length;
  const ab = sh(`git rev-list --left-right --count ${baseRef}...HEAD`)?.split(/\s+/) ?? [];
  lines.push(`Branch ${branch}${dirty ? ` · ${dirty} uncommitted file(s)` : " · clean"}${ab.length === 2 ? ` · ${ab[1]} ahead / ${ab[0]} behind ${baseRef}` : ""}`);
  const gone = (sh(`git for-each-ref "--format=%(refname:short)%09%(upstream:track)" refs/heads`) ?? "")
    .split("\n").filter((l) => l.includes("[gone]")).map((l) => l.split("\t")[0]);
  const merged = (sh(`git branch "--format=%(refname:short)" --merged ${baseRef}`) ?? "")
    .split("\n").filter((b) => b && b !== base && b !== branch && !gone.includes(b));
  if (gone.length) lines.push(`Branches whose remote is gone (PR merged/deleted): ${gone.join(", ")}`);
  if (merged.length) lines.push(`Branches fully merged into ${baseRef}: ${merged.join(", ")}`);
  const worktrees = (sh("git worktree list --porcelain") ?? "").split("\n").filter((l) => l.startsWith("worktree ")).length;
  if (worktrees > 1) lines.push(`${worktrees - 1} extra worktree(s) — check with \`git worktree list\``);
  const stashes = (sh("git stash list") ?? "").split("\n").filter(Boolean).length;
  if (stashes) lines.push(`${stashes} stash(es) — ask before dropping`);
  if (openPRs) lines.push(openPRs.length ? `Open PRs:\n${openPRs.map((p) => `- ${prLine(p)}`).join("\n")}` : "Open PRs: none");
  else if (hasRemote) lines.push("PR status: `gh` unavailable — check open PRs with the GitHub tools you have.");
} else {
  if (state.baseSha && baseSha && state.baseSha !== baseSha) {
    const log = sh(`git log --oneline --no-decorate -8 ${state.baseSha}..${baseSha}`);
    if (log) lines.push(`${baseRef} advanced:\n${log}`);
  }
  if (openPRs && state.openPRs) {
    const now = new Set(openPRs.map((p) => p.number));
    const closed = state.openPRs.filter((p) => !now.has(p.number));
    const fresh = openPRs.filter((p) => !state.openPRs.some((s) => s.number === p.number));
    if (closed.length) lines.push(`PRs no longer open (merged or closed): ${closed.map((p) => `#${p.number} ${p.title}`).join("; ")}`);
    if (fresh.length) lines.push(`New PRs: ${fresh.map((p) => `#${p.number}`).join(", ")}`);
    const red = openPRs.filter((p) => /CI red|CONFLICT/.test(prLine(p)));
    const redBefore = new Set(state.red ?? []);
    const newlyRed = red.filter((p) => !redBefore.has(p.number));
    if (newlyRed.length) lines.push(`Needs attention:\n${newlyRed.map((p) => `- ${prLine(p)}`).join("\n")}`);
  }
}

const red = (openPRs ?? []).filter((p) => /CI red|CONFLICT/.test(prLine(p))).map((p) => p.number);
try {
  fs.writeFileSync(statePath, JSON.stringify({
    checkedAt: Date.now(),
    baseSha: baseSha ?? state.baseSha,
    openPRs: openPRs ? openPRs.map((p) => ({ number: p.number, title: p.title })) : state.openPRs,
    red,
  }));
} catch {}

if (SESSION) {
  emit("SessionStart", `${rules()}\n\n## Git status at session start (JRules git-pulse)\n${lines.join("\n")}\nFollow "Task start" in the rules above before new work.`);
}
emit("UserPromptSubmit", lines.length ? `JRules git-pulse — changes since last check:\n${lines.join("\n")}\nRun the \`sync\` skill's after-merge steps before continuing.` : "");
