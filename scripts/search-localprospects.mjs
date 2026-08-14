#!/usr/bin/env node
/**
 * Search LocalProspects for greater Spokane WA contractors and upsert into Convex.
 *
 * Usage:
 *   node scripts/search-localprospects.mjs --keyword=Plumber --dry-run
 *   node scripts/search-localprospects.mjs --keyword=Plumber
 *   node scripts/search-localprospects.mjs --popular-rest --dry-run
 *   node scripts/search-localprospects.mjs --from-cache --keyword=Plumber
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isContractorCategory, isWaOrIdState, slugify } from "./import-lib.mjs";
import { mapBusiness } from "./localprospects-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const API_BASE = "https://localprospects.ai/api/v1";
const SEARCH_LOCATIONS = ["Spokane, WA", "Spokane Valley, WA"];
const DEFAULT_DEPTH = 100;
const cacheDir = path.join(root, "localprospects-search-cache");

const fromCache = process.argv.includes("--from-cache");
const dryRun = process.argv.includes("--dry-run");
const popularRest = process.argv.includes("--popular-rest");
const keywordArg = process.argv
  .find((arg) => arg.startsWith("--keyword="))
  ?.slice("--keyword=".length);
const depthArg = process.argv
  .find((arg) => arg.startsWith("--depth="))
  ?.slice("--depth=".length);
const depth = depthArg ? Number(depthArg) : DEFAULT_DEPTH;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheFile(keyword, locationQuery) {
  return path.join(
    cacheDir,
    `${slugify(keyword)}-${slugify(locationQuery)}.json`,
  );
}

function popularContractorKeywords() {
  const gbpPath = path.join(root, "src/resources/gbp-categories.json");
  const gbp = JSON.parse(readFileSync(gbpPath, "utf8"));
  return gbp.popular.filter((name) => isContractorCategory(name));
}

async function apiGet(apiKey, pathname) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    headers: { "x-api-key": apiKey },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `GET ${pathname} failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function apiPost(apiKey, pathname, payload) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `POST ${pathname} failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function lookupLocationCode(apiKey, query) {
  const body = await apiGet(
    apiKey,
    `/locations?q=${encodeURIComponent(query)}`,
  );
  const locations = body.locations ?? [];
  const wantsValley = /valley/i.test(query);
  const inWa = (loc) =>
    /washington|\bwa\b/i.test(String(loc.full_name ?? loc.name ?? ""));
  const hasValley = (loc) =>
    /valley/i.test(String(loc.full_name ?? loc.name ?? ""));
  const match =
    locations.find((loc) => inWa(loc) && hasValley(loc) === wantsValley) ??
    locations.find((loc) => inWa(loc)) ??
    locations[0];
  if (!match?.location_code) {
    throw new Error(
      `No location_code for ${query}: ${JSON.stringify(locations.slice(0, 5))}`,
    );
  }
  return {
    query,
    location_code: match.location_code,
    name: match.full_name ?? match.name,
  };
}

async function searchAndWait(apiKey, keyword, locationCode) {
  const started = await apiPost(apiKey, "/search", {
    keyword,
    location_code: locationCode,
    depth,
  });
  const jobId = started.job_id ?? started.id;
  if (!jobId) {
    throw new Error(`Search did not return job_id: ${JSON.stringify(started)}`);
  }
  for (let i = 0; i < 60; i += 1) {
    const job = await apiGet(apiKey, `/job/${jobId}`);
    const status = job.status ?? job.job?.status;
    if (status === "completed" || status === "complete") {
      const results = await apiGet(apiKey, `/job/${jobId}/results`);
      return { jobId, job, results, usage: results.usage ?? job.usage };
    }
    if (status === "failed" || status === "error") {
      throw new Error(`Job ${jobId} failed: ${JSON.stringify(job)}`);
    }
    await sleep(5000);
  }
  throw new Error(`Job ${jobId} timed out waiting for completion`);
}

function resultRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.businesses)) return payload.businesses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function classifyAndMap(rows) {
  const kept = [];
  const dropped = {
    missing: 0,
    nonContractor: 0,
    notWaOrId: 0,
  };
  for (const row of rows) {
    const mapped = mapBusiness(row, row.website);
    if (!mapped.name || !mapped.category || !mapped.contractor) {
      dropped.missing += 1;
      continue;
    }
    if (!isContractorCategory(mapped.category)) {
      dropped.nonContractor += 1;
      continue;
    }
    if (!isWaOrIdState(mapped.stateRaw, mapped.cityRaw)) {
      dropped.notWaOrId += 1;
      continue;
    }
    kept.push(mapped.contractor);
  }
  return { kept, dropped };
}

function dedupeByCid(contractors) {
  const byCid = new Map();
  for (const contractor of contractors) {
    byCid.set(contractor.googleCid, contractor);
  }
  return [...byCid.values()];
}

function upsertBatches(contractors) {
  const batchSize = 80;
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < contractors.length; i += batchSize) {
    const batch = contractors.slice(i, i + batchSize);
    const result = runConvex("internal.contractors.upsertBatch", {
      contractors: batch,
    });
    inserted += result?.inserted ?? 0;
    updated += result?.updated ?? 0;
  }
  return { inserted, updated };
}

async function runKeyword(apiKey, keyword, locationCodes) {
  mkdirSync(cacheDir, { recursive: true });
  const allKept = [];
  const summaries = [];

  for (const loc of locationCodes) {
    const file = cacheFile(keyword, loc.query);
    let payload;
    if (fromCache || existsSync(file)) {
      console.log(`Reading cache ${file}`);
      payload = JSON.parse(readFileSync(file, "utf8"));
    } else {
      console.log(
        `Searching "${keyword}" in ${loc.name} (${loc.location_code}) depth=${depth}`,
      );
      payload = await searchAndWait(apiKey, keyword, loc.location_code);
      writeFileSync(file, JSON.stringify(payload, null, 2));
      console.log(`Wrote ${file}`);
    }
    const rows = resultRows(payload.results ?? payload);
    const { kept, dropped } = classifyAndMap(rows);
    summaries.push({
      location: loc.name,
      jobId: payload.jobId,
      usage: payload.usage,
      results: rows.length,
      kept: kept.length,
      dropped,
    });
    allKept.push(...kept);
  }

  const unique = dedupeByCid(allKept);
  console.log(
    JSON.stringify(
      { keyword, depth, locations: summaries, uniqueKept: unique.length },
      null,
      2,
    ),
  );
  console.log(
    unique
      .slice(0, 8)
      .map(
        (c) =>
          `${c.name} | ${c.category} | ${c.city} | ${c.phone ?? ""} | ${c.website ?? ""}`,
      )
      .join("\n"),
  );

  if (dryRun) {
    console.log("Dry run — skipping Convex upsert");
    return { inserted: 0, updated: 0, unique: unique.length };
  }

  const result = upsertBatches(unique);
  console.log(
    `Done ${keyword}. inserted=${result.inserted} updated=${result.updated}`,
  );
  return { ...result, unique: unique.length };
}

async function main() {
  loadEnvLocal();
  const apiKey = process.env.LOCALPROSPECTS_API_KEY;
  if (!apiKey) {
    throw new Error("Set LOCALPROSPECTS_API_KEY in .env.local");
  }
  if (!Number.isFinite(depth) || ![100, 300, 500, 700].includes(depth)) {
    throw new Error(`Invalid --depth=${depthArg}. Use 100, 300, 500, or 700.`);
  }

  const keywords = [];
  if (keywordArg) keywords.push(keywordArg);
  if (popularRest) {
    for (const name of popularContractorKeywords()) {
      if (name.toLowerCase() === "plumber") continue;
      if (!keywords.includes(name)) keywords.push(name);
    }
  }
  if (keywords.length === 0) {
    throw new Error("Pass --keyword=Plumber and/or --popular-rest");
  }

  const locationCodes = [];
  for (const query of SEARCH_LOCATIONS) {
    locationCodes.push(await lookupLocationCode(apiKey, query));
  }
  console.log("Locations:", locationCodes);

  for (const keyword of keywords) {
    await runKeyword(apiKey, keyword, locationCodes);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
