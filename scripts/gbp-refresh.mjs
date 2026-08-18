#!/usr/bin/env node
/**
 * Post or collect DataForSEO Google My Business Info tasks.
 * Cron is commented out in convex/crons.ts until you turn it on.
 *
 * Usage:
 *   node scripts/gbp-refresh.mjs --post --dry-run
 *   node scripts/gbp-refresh.mjs --post --limit 10
 *   node scripts/gbp-refresh.mjs --collect
 *   node scripts/gbp-refresh.mjs --collect --dry-run
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const post = process.argv.includes("--post");
const collect = process.argv.includes("--collect");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;

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

if (!post && !collect) {
  console.error("Pass --post and/or --collect (optional --dry-run, --limit=N)");
  process.exit(1);
}

if (post) {
  const args = { dryRun };
  if (typeof limit === "number" && Number.isFinite(limit)) {
    args.limit = limit;
  }
  const report = runConvex("internal.gbpRefresh.postTasks", args);
  console.log("postTasks", JSON.stringify(report, null, 2));
}

if (collect) {
  const report = runConvex("internal.gbpRefresh.collectReady", { dryRun });
  console.log("collectReady", JSON.stringify(report, null, 2));
}
