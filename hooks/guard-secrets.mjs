// PreToolUse hook (Bash, Write, Edit, MultiEdit): stops secrets from reaching the frontend or git.
//   Write/Edit: blocks secret-named public env vars (NEXT_PUBLIC_*SECRET* etc.) anywhere, known secret formats in
//               files git would track, and creating a .env file that git doesn't ignore.
//   Bash:       on `git commit`, blocks staged .env files and staged added lines containing secret formats.
// A line containing `jrules:allow-secret` is skipped (test fixtures). Exit code 2 blocks and shows stderr to Claude.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

let input = "";
for await (const chunk of process.stdin) input += chunk;

let data;
try {
  data = JSON.parse(input);
} catch {
  process.exit(0);
}
const tool = data?.tool_name ?? "";
const ti = data?.tool_input ?? {};
const cwd = data?.cwd ?? process.cwd();

const SECRET_FORMATS = [
  [/\bsk_live_[0-9A-Za-z]{10,}/, "Stripe live secret key"],
  [/\brk_live_[0-9A-Za-z]{10,}/, "Stripe restricted key"],
  [/\bwhsec_[0-9A-Za-z]{20,}/, "Stripe webhook secret"],
  [/\bsb_secret_[0-9A-Za-z_-]{10,}/, "Supabase secret key"],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/, "private key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[0-9A-Za-z]{36,}/, "GitHub token"],
  [/\bsk-ant-[0-9A-Za-z_-]{20,}/, "Anthropic API key"],
  [/\bsk-proj-[0-9A-Za-z_-]{20,}/, "OpenAI API key"],
];
// Secret-named env vars with a public prefix, in env contexts only: `process.env.X` / `import.meta.env.X`,
// `env["X"]`, a quoted name, or an env-file assignment `X=` — not ordinary identifiers that happen to match.
const PUB_NAME = "(?:NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_|REACT_APP_|PUBLIC_|NUXT_PUBLIC_|GATSBY_)[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY|WEBHOOK)[A-Z0-9_]*";
const PUBLIC_SECRET_NAME = new RegExp(`(?:env\\.|env\\[\\s*["'\`]|["'\`]|^\\s*(?:export\\s+)?(?=${PUB_NAME}\\s*=))(${PUB_NAME})\\b`);
const JWT = /\beyJ[0-9A-Za-z_-]{10,}\.(eyJ[0-9A-Za-z_-]{10,})\.[0-9A-Za-z_-]{10,}/g;
const ALLOW = "jrules:allow-secret";
const ENV_FILE = /(^|[\\/])\.env(\.[^\\/]*)?$/i;
const ENV_EXAMPLE = /example|sample|template|defaults/i;

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch {
    return null;
  }
};
const block = (msg) => {
  process.stderr.write(`JRules guard-secrets: ${msg}\n`);
  process.exit(2);
};

// Returns a description of the first secret found in `text`, or null.
function findSecret(text, { formats = true } = {}) {
  for (const line of text.split("\n")) {
    if (line.includes(ALLOW)) continue;
    const pub = line.match(PUBLIC_SECRET_NAME);
    if (pub) return `public-prefixed env var '${pub[1]}' — anything with a public prefix ships to the browser. Keep secrets server-only (no public prefix).`;
    if (!formats) continue;
    for (const [re, name] of SECRET_FORMATS) if (re.test(line)) return `${name} in plain text`;
    for (const m of line.matchAll(JWT)) {
      try {
        const payload = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
        if (payload?.role === "service_role") return "Supabase service_role JWT";
      } catch {}
    }
  }
  return null;
}

const isIgnored = (file) => git(`check-ignore -q "${file}"`) !== null;
const inRepo = () => git("rev-parse --is-inside-work-tree") !== null;

if (tool === "Write" || tool === "Edit" || tool === "MultiEdit") {
  const file = ti.file_path ?? "";
  const text = [ti.content, ti.new_string, ...(ti.edits ?? []).map((e) => e?.new_string)].filter(Boolean).join("\n");
  const rel = path.isAbsolute(file) ? path.relative(cwd, file) : file;
  const envFile = ENV_FILE.test(file) && !ENV_EXAMPLE.test(path.basename(file));
  const repo = inRepo();
  if (envFile && repo && !isIgnored(rel)) block(`${rel} is not git-ignored. Add '.env*' and '!.env.example' to .gitignore first.`);
  // Secret formats are fine in git-ignored files (e.g. .env.local); public-prefixed secret names never are.
  const tracked = repo ? !isIgnored(rel) : !envFile;
  const hit = findSecret(text, { formats: tracked && !(envFile) });
  if (hit) block(`${hit} → ${rel}. Put the value in a git-ignored .env file and read it server-side.`);
  process.exit(0);
}

if (tool === "Bash") {
  const command = ti.command ?? "";
  if (!/\bgit\b[^\n;&|]*\bcommit\b/.test(command)) process.exit(0);
  if (!inRepo()) process.exit(0);
  // `git add … && git commit` runs this hook before the add, so then judge everything that could be added.
  const addsFirst = /\bgit\s+add\b/.test(command.slice(0, command.search(/\bcommit\b/)));
  const all = addsFirst || /\bcommit\b[^\n;&|]*\s-(?:[a-zA-Z]*a[a-zA-Z]*|-all)\b/.test(command); // -a / -am / --all
  const untracked = addsFirst ? (git("ls-files --others --exclude-standard") ?? "").split("\n").filter(Boolean) : [];
  const names = [...(git(all ? "diff HEAD --name-only" : "diff --cached --name-only") ?? "").split("\n"), ...untracked].filter(Boolean);
  const envStaged = names.filter((n) => ENV_FILE.test(n) && !ENV_EXAMPLE.test(path.basename(n)));
  if (envStaged.length) block(`refusing to commit env file(s): ${envStaged.join(", ")}. Unstage (git rm --cached) and git-ignore them.`);
  for (const f of untracked) {
    let text = "";
    try { const p = path.join(cwd, f); if (fs.statSync(p).size < 2_000_000) text = fs.readFileSync(p, "utf8"); } catch {}
    const hit = findSecret(text);
    if (hit) block(`${hit} in ${f}, which this command would commit. Remove it, move it to a git-ignored .env, and rotate it if it was ever pushed.`);
  }
  const diff = git(all ? "diff HEAD -U0 --no-color" : "diff --cached -U0 --no-color") ?? "";
  let file = "";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) file = line.slice(6);
    else if (line.startsWith("+") && !line.startsWith("+++")) {
      const hit = findSecret(line.slice(1));
      if (hit) block(`${hit} in staged changes (${file}). Remove it, move it to a git-ignored .env, and rotate it if it was ever pushed.`);
    }
  }
}
process.exit(0);
