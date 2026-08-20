#!/usr/bin/env node
/**
 * Import a directory-only JSON drop (LocalProspects CLI export) into Convex.
 *
 * Trusts stamped marketSlug. Does not infer metro from city or street names.
 * Generates URL slugs here. Skips non-contractor categories.
 *
 * Usage:
 *   node scripts/import-directory.mjs --file src/resources/directory-samples.json --dry-run
 *   node scripts/import-directory.mjs --file exports/directory-spokane.json --market spokane
 *
 * Do not upsert directory-samples.json (mixed metros). Spokane stays on CSV/NICC
 * until a real exports/directory-spokane.json exists. --market is required
 * (spokane|boise|raleigh|portland).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatPhone,
  isContractorCategory,
  normalizeCity,
  slugify,
} from "./import-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "directory-import-report.json");
const KNOWN_MARKETS = new Set([
  "spokane",
  "boise",
  "raleigh",
  "portland",
  "indianapolis",
  "kansas-city",
  "nashville",
  "charlotte",
  "salt-lake",
  "columbus",
]);
const BATCH_SIZE = 50;

const fileArg = process.argv
  .find((arg) => arg.startsWith("--file="))
  ?.slice("--file=".length);
const marketArg = process.argv
  .find((arg) => arg.startsWith("--market="))
  ?.slice("--market=".length);
const dryRun = process.argv.includes("--dry-run");

function argValue(flag) {
  const eq = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith("-")) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const jsonPath = path.resolve(root, fileArg || argValue("--file") || "");
const marketFilter = marketArg || argValue("--market");

function isDigitCid(value) {
  return /^\d+$/.test(String(value ?? "").trim());
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

function readListings(filePath) {
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.listings)) return parsed.listings;
  throw new Error("JSON must be an array or { listings: [...] }");
}

function optionalTrim(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function mapListing(row, slug) {
  const googleCid = String(row.googleCid).trim();
  const payload = {
    marketSlug: String(row.marketSlug).trim(),
    slug,
    name: String(row.name).trim(),
    googleCid,
    googleMapsRank:
      typeof row.googleMapsRank === "number" && Number.isFinite(row.googleMapsRank)
        ? row.googleMapsRank
        : 0,
    category: String(row.category).trim(),
    claimed: Boolean(row.claimed),
    socials: Array.isArray(row.socials)
      ? row.socials
          .filter(
            (item) =>
              item &&
              typeof item.platform === "string" &&
              typeof item.url === "string" &&
              item.url.startsWith("http"),
          )
          .map((item) => ({
            platform: item.platform.trim().toLowerCase(),
            url: item.url.trim(),
          }))
      : [],
    source: "directory-json",
    sourceUpdatedAt: Date.now(),
  };

  const city = optionalTrim(row.city);
  if (city) payload.city = normalizeCity(city) ?? city;
  const state = optionalTrim(row.state);
  if (state) payload.state = state;
  const phone = formatPhone(row.phone);
  if (phone) payload.phone = phone;
  const website = optionalTrim(row.website);
  if (website) payload.website = website;
  const gbpUrl = optionalTrim(row.gbpUrl);
  payload.gbpUrl = gbpUrl || `https://www.google.com/maps?cid=${googleCid}`;
  const logoUrl = optionalTrim(row.logoUrl);
  if (logoUrl) payload.logoUrl = logoUrl;
  const mainImageUrl = optionalTrim(row.mainImageUrl);
  if (mainImageUrl) payload.mainImageUrl = mainImageUrl;
  if (typeof row.rating === "number" && Number.isFinite(row.rating)) {
    payload.rating = row.rating;
  }
  if (typeof row.reviewCount === "number" && Number.isFinite(row.reviewCount)) {
    payload.reviewCount = row.reviewCount;
  }

  return payload;
}

function uniqueSlug(name, googleCid, usedInMarket) {
  const base = slugify(name) || "contractor";
  let slug = base;
  if (usedInMarket.has(slug)) {
    slug = `${base}-${googleCid.slice(-6)}`;
  }
  usedInMarket.add(slug);
  return slug;
}

async function main() {
  if (!fileArg && !argValue("--file")) {
    throw new Error("Pass --file path/to/directory-spokane.json");
  }
  if (!marketFilter) {
    throw new Error(
      `Pass --market ${[...KNOWN_MARKETS].join("|")} (required)`,
    );
  }
  if (!KNOWN_MARKETS.has(marketFilter)) {
    throw new Error(
      `Unknown --market ${marketFilter}. Known: ${[...KNOWN_MARKETS].join(", ")}`,
    );
  }

  const listings = readListings(jsonPath);
  const dropped = [];
  const kept = [];
  const usedSlugsByMarket = new Map();

  for (const row of listings) {
    const marketSlug = optionalTrim(row?.marketSlug);
    const name = optionalTrim(row?.name);
    const category = optionalTrim(row?.category);
    const googleCid = String(row?.googleCid ?? "").trim();

    if (!marketSlug || !name || !category || !isDigitCid(googleCid)) {
      dropped.push({
        name,
        category,
        marketSlug,
        reason: "missing marketSlug, name, category, or digit googleCid",
      });
      continue;
    }
    if (marketFilter && marketSlug !== marketFilter) {
      dropped.push({
        name,
        category,
        marketSlug,
        reason: `stamped ${marketSlug}, skipped (--market ${marketFilter})`,
      });
      continue;
    }
    if (!isContractorCategory(category)) {
      dropped.push({
        name,
        category,
        marketSlug,
        reason: "non-contractor category",
      });
      continue;
    }

    const used = usedSlugsByMarket.get(marketSlug) ?? new Set();
    usedSlugsByMarket.set(marketSlug, used);
    const slug = uniqueSlug(name, googleCid, used);
    kept.push(mapListing(row, slug));
  }

  const report = {
    file: jsonPath,
    marketFilter: marketFilter ?? null,
    totalRows: listings.length,
    kept: kept.length,
    dropped: dropped.length,
    byMarket: Object.fromEntries(
      [...usedSlugsByMarket.entries()].map(([slug, set]) => [slug, set.size]),
    ),
    droppedSample: dropped,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `Kept ${kept.length}, dropped ${dropped.length} from ${listings.length} rows`,
  );
  console.log(`Wrote ${reportPath}`);

  if (dryRun) {
    console.log("Dry run — skipping Convex upsert");
    return;
  }

  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < kept.length; i += BATCH_SIZE) {
    const batch = kept.slice(i, i + BATCH_SIZE);
    console.log(
      `Upserting batch ${i / BATCH_SIZE + 1}/${Math.ceil(kept.length / BATCH_SIZE)} (${batch.length})`,
    );
    const result = runConvex("internal.contractors.upsertBatch", {
      contractors: batch,
    });
    inserted += result?.inserted ?? 0;
    updated += result?.updated ?? 0;
  }

  console.log(`Done. inserted=${inserted} updated=${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
