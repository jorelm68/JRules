// PreToolUse hook (Bash): blocks `git commit` while on the default branch and `git push` targeting it.
// Exit code 2 blocks the tool call and shows stderr to Claude.
import { execSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

let command = "";
let cwd = process.cwd();
try {
  const data = JSON.parse(input);
  command = data?.tool_input?.command ?? "";
  cwd = data?.cwd ?? cwd;
} catch {
  process.exit(0);
}

if (!/\bgit\b/.test(command)) process.exit(0);

const PROTECTED = new Set(["main", "master"]);
const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};
const block = (msg) => {
  process.stderr.write(`jrules: ${msg} Create a task branch first: git switch -c <type>/<slug>\n`);
  process.exit(2);
};

// Split chained commands so `git switch -c x && git commit` is judged per segment.
for (const segment of command.split(/&&|\|\||;|\n/)) {
  const s = segment.trim();
  // The hook runs before the command, so a branch switch earlier in the same command makes the current-branch
  // check unreliable; don't judge implicit targets (current branch / HEAD) in that case.
  const switchesFirst = /\bgit\s+(switch|checkout)\b/.test(command.slice(0, command.indexOf(s)));
  if (/^git\s+(-C\s+\S+\s+)?commit\b/.test(s)) {
    const branch = git("branch --show-current");
    const isFirstCommit = git("rev-parse --verify HEAD") === ""; // a new repo needs one commit on main to branch from
    if (PROTECTED.has(branch) && !switchesFirst && !isFirstCommit) block(`refusing to commit directly on '${branch}'.`);
  }
  if (/^git\s+(-C\s+\S+\s+)?push\b/.test(s)) {
    const tokens = s.split(/\s+/);
    const branch = switchesFirst ? "" : git("branch --show-current");
    const targetsProtected = tokens.some((t) => {
      const dest = (t.includes(":") ? t.split(":").pop() : t).replace(/^\+/, "").replace(/^refs\/heads\//, "");
      return PROTECTED.has(dest) || (dest === "HEAD" && PROTECTED.has(branch));
    });
    const bare = tokens.filter((t) => !t.startsWith("-")).length <= 3; // git push [remote]
    if (targetsProtected || (bare && PROTECTED.has(branch))) block("refusing to push to the default branch — open a PR instead.");
  }
}
process.exit(0);
