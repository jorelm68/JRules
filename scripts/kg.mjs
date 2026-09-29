#!/usr/bin/env node
// Query a project's knowledge graph (docs/KNOWLEDGE.md) without reading the whole file.
//   node kg.mjs index                 the one-line-per-node index
//   node kg.mjs query <id> [id...]    node section(s) + incoming edges + neighbor index lines
//   node kg.mjs owner <path> [...]    which node owns a file, and what depends on it (impact before editing)
//   node kg.mjs check                 stale map: missing index/sections, dangling [[links]], missing file paths
// Options: --file <path> (default: <git root>/docs/KNOWLEDGE.md). Exit 1 on `check` problems or unknown ids.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const fileFlag = argv.indexOf("--file");
const explicit = fileFlag >= 0 ? argv.splice(fileFlag, 2)[1] : null;
const [cmd, ...args] = argv;
let root = process.cwd();
try { root = execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
const file = explicit ?? path.join(root, "docs", "KNOWLEDGE.md");
if (!fs.existsSync(file)) {
  console.log(`No knowledge map at ${file} — run /jrules-init to create one.`);
  process.exit(cmd === "check" ? 1 : 0);
}

// Parse: "## Index" bullets, "### <id> — title" node sections, [[id]] edges, backticked paths on "Files:" lines.
const lines = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").split("\n");
const index = new Map(); // id -> index line
const nodes = new Map(); // id -> { lines, links:Set, files:[] }
let section = "";
let current = null;
for (const line of lines) {
  const h2 = line.match(/^##\s+(.*)/);
  const h3 = line.match(/^###\s+\[?\[?([\w./-]+)\]?\]?/);
  if (h2 && !line.startsWith("###")) { section = h2[1].trim().toLowerCase(); current = null; continue; }
  if (h3 && section.startsWith("nodes")) {
    current = { lines: [line], links: new Set(), files: [] };
    nodes.set(h3[1], current);
    continue;
  }
  if (section.startsWith("index")) {
    const m = line.match(/^\s*-\s+\[?\[?([\w./-]+)\]?\]?\s/);
    if (m) index.set(m[1], line.trim());
    continue;
  }
  if (!current) continue;
  current.lines.push(line);
  for (const l of line.matchAll(/\[\[([\w./-]+)\]\]/g)) current.links.add(l[1]);
  if (/\*\*Files:\*\*/.test(line)) {
    for (const f of line.matchAll(/`([^`]+)`/g)) current.files.push(f[1].replace(/:\d+(-\d+)?$/, ""));
  }
}
const incoming = (id) => [...nodes].filter(([, n]) => n.links.has(id)).map(([k]) => k);
const trim = (arr) => { while (arr.length && !arr.at(-1).trim()) arr.pop(); return arr; };

switch (cmd) {
  case "index":
    console.log(index.size ? [...index.values()].join("\n") : [...nodes.keys()].map((k) => `- ${k}`).join("\n"));
    break;
  case "query": {
    let missing = 0;
    for (const id of args) {
      const n = nodes.get(id);
      if (!n) { console.log(`Unknown node '${id}'. Known: ${[...nodes.keys()].join(", ")}`); missing++; continue; }
      console.log(trim([...n.lines]).join("\n"));
      const inc = incoming(id);
      if (inc.length) console.log(`- **Referenced by:** ${inc.map((k) => `[[${k}]]`).join(" · ")}`);
      const neighbors = [...new Set([...n.links, ...inc])].filter((k) => k !== id && index.has(k));
      if (neighbors.length) console.log(`Neighbors:\n${neighbors.map((k) => `  ${index.get(k)}`).join("\n")}`);
      console.log("");
    }
    process.exit(missing ? 1 : 0);
  }
  case "owner":
    for (const p of args) {
      const rel = path.relative(root, path.resolve(p)).replaceAll("\\", "/");
      const owners = [...nodes].filter(([, n]) => n.files.some((f) => rel === f.replace(/\/$/, "") || rel.startsWith(f.endsWith("/") ? f : `${f}/`)));
      if (!owners.length) { console.log(`${rel}: no node owns it — add it to the map if it matters.`); continue; }
      for (const [id] of owners) {
        const inc = incoming(id);
        console.log(`${rel} → [[${id}]]${inc.length ? ` · linked from: ${inc.join(", ")}` : ""}`);
      }
    }
    break;
  case "check": {
    const problems = [];
    for (const id of nodes.keys()) if (index.size && !index.has(id)) problems.push(`node '${id}' missing from ## Index`);
    for (const id of index.keys()) if (!nodes.has(id)) problems.push(`index entry '${id}' has no ### section`);
    for (const [id, n] of nodes) {
      for (const l of n.links) if (!nodes.has(l)) problems.push(`[[${l}]] in '${id}' points nowhere`);
      for (const f of n.files) if (!/[*{}<>]/.test(f) && !fs.existsSync(path.join(root, f))) problems.push(`'${id}' lists missing path ${f}`);
    }
    console.log(problems.length ? problems.map((p) => `- ${p}`).join("\n") : `Knowledge map OK (${nodes.size} nodes).`);
    process.exit(problems.length ? 1 : 0);
  }
  default:
    console.log("Usage: kg.mjs index | query <id...> | owner <path...> | check   [--file docs/KNOWLEDGE.md]");
    process.exit(cmd ? 1 : 0);
}
