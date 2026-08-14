#!/usr/bin/env node
/**
 * Enrich contractors with WA L&I licenses (same matcher as the weekly Convex cron).
 *
 * Usage:
 *   node scripts/enrich-licenses.mjs
 *   node scripts/enrich-licenses.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function runConvex(functionName, args) {
  const result = spawnSync(
    "npx",
    ["convex", "run", functionName, JSON.stringify(args ?? {})],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`convex run ${functionName} failed`);
  }
  const out = (result.stdout || "").trim();
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

const report = runConvex("internal.licenses.enrichWa", { dryRun });
console.log(JSON.stringify(report, null, 2));
