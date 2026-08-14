#!/usr/bin/env node
/**
 * Enrich a business via LocalProspects and upsert it into Convex.
 *
 * Usage:
 *   node scripts/import-localprospects.mjs --dry-run
 *   node scripts/import-localprospects.mjs
 *   node scripts/import-localprospects.mjs --domain=example.com --dry-run
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isContractorCategory,
} from "./import-lib.mjs";
import { hostnameFromDomain, mapBusiness } from "./localprospects-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const API_BASE = "https://localprospects.ai/api/v1";
const DEFAULT_DOMAIN = "deckbuildersspokanewa.com";

const cachePath = path.join(root, "localprospects-last.json");
const fromCache = process.argv.includes("--from-cache");
const dryRun = process.argv.includes("--dry-run");
const ratingArg = process.argv
  .find((arg) => arg.startsWith("--rating="))
  ?.slice("--rating=".length);
const reviewsArg = process.argv
  .find((arg) => arg.startsWith("--reviews="))
  ?.slice("--reviews=".length);
const domainArg = process.argv
  .find((arg) => arg.startsWith("--domain="))
  ?.slice("--domain=".length);

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const comment = value.indexOf(" #");
    if (comment !== -1) value = value.slice(0, comment).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function runConvex(functionName, args) {
  const result = spawnSync(
    "npx",
    ["convex", "run", functionName, JSON.stringify(args)],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
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

async function enrichLead(apiKey, domain) {
  const response = await fetch(`${API_BASE}/enrich`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      leads: [
        {
          domain,
          city: "Spokane",
          state: "WA",
        },
      ],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `LocalProspects enrich failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function main() {
  loadEnvLocal();
  const apiKey = process.env.LOCALPROSPECTS_API_KEY;
  if (!apiKey) {
    throw new Error("Set LOCALPROSPECTS_API_KEY in .env.local");
  }

  const domain = hostnameFromDomain(domainArg || DEFAULT_DOMAIN);
  let payload;
  if (fromCache) {
    console.log(`Reading cached enrich from ${cachePath}`);
    payload = JSON.parse(readFileSync(cachePath, "utf8"));
  } else {
    console.log(`Enriching ${domain} via LocalProspects`);
    payload = await enrichLead(apiKey, domain);
    writeFileSync(cachePath, JSON.stringify(payload, null, 2));
    console.log(`Wrote ${cachePath}`);
  }
  const row = payload.results?.[0];
  if (!row) {
    throw new Error("No results in enrich response");
  }
  if (row.status !== "success" || !row.result) {
    throw new Error(
      `Enrichment did not succeed: ${JSON.stringify({
        status: row.status,
        error: row.error,
      })}`,
    );
  }

  const mapped = mapBusiness(row.result, domain);
  if (ratingArg) {
    const rating = Number(ratingArg);
    if (!Number.isFinite(rating)) {
      throw new Error(`Invalid --rating=${ratingArg}`);
    }
    mapped.contractor.rating = rating;
  }
  if (reviewsArg) {
    const reviewCount = Number(reviewsArg);
    if (!Number.isFinite(reviewCount)) {
      throw new Error(`Invalid --reviews=${reviewsArg}`);
    }
    mapped.contractor.reviewCount = reviewCount;
  }
  if (!mapped.name || !mapped.category) {
    throw new Error("Missing name or category on enriched business");
  }
  if (!isContractorCategory(mapped.category)) {
    throw new Error(`Skipped non-contractor category: ${mapped.category}`);
  }
  if (!mapped.location) {
    throw new Error("Skipped listing outside WA/ID");
  }

  console.log(
    JSON.stringify(
      {
        usage: payload.usage,
        contractor: mapped.contractor,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run — skipping Convex upsert");
    return;
  }

  const result = runConvex("internal.contractors.upsertBatch", {
    contractors: [mapped.contractor],
  });
  console.log(
    `Done. inserted=${result?.inserted ?? 0} updated=${result?.updated ?? 0}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
