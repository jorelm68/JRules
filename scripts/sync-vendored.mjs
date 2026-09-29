#!/usr/bin/env node
// Refreshes third-party skills vendored into skills/ (shipped with the plugin, so every project and cloud
// session gets them). Copies upstream verbatim, adds its LICENSE, and records the commit in UPSTREAM.md.
// Never edit a vendored skill by hand — change the jrules skills that point to it instead. Usage:
//   node scripts/sync-vendored.mjs            refresh all
//   node scripts/sync-vendored.mjs <name>     refresh one
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VENDORED = {
  "security-audit": { repo: "cloudflare/security-audit-skill", path: "skills/security-audit", license: "MIT" },
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const picked = process.argv.slice(2);
const unknown = picked.filter((n) => !VENDORED[n]);
if (unknown.length) {
  console.error(`Unknown skill(s): ${unknown.join(", ")}. Vendored: ${Object.keys(VENDORED).join(", ")}`);
  process.exit(1);
}

for (const name of picked.length ? picked : Object.keys(VENDORED)) {
  const { repo, path, license } = VENDORED[name];
  const tmp = mkdtempSync(join(tmpdir(), "jrules-vendor-"));
  try {
    execFileSync("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${repo}`, tmp], { stdio: "inherit" });
    const commit = execFileSync("git", ["-C", tmp, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dest = join(root, "skills", name);
    rmSync(dest, { recursive: true, force: true });
    cpSync(join(tmp, path), dest, { recursive: true });
    cpSync(join(tmp, "LICENSE"), join(dest, "LICENSE"));
    writeFileSync(
      join(dest, "UPSTREAM.md"),
      `# Vendored skill — do not edit\n\n` +
        `- Source: https://github.com/${repo}/tree/${commit}/${path}\n` +
        `- Commit: ${commit}\n- License: ${license} (see LICENSE)\n\n` +
        `Refresh with \`node scripts/sync-vendored.mjs ${name}\` from the jrules repo root, then review the diff.\n`,
    );
    console.log(`${name}: ${repo}@${commit.slice(0, 12)}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
