#!/usr/bin/env node
/**
 * Import filtered contractors from the Spokane CSV into Convex.
 *
 * Usage:
 *   node scripts/import-contractors.mjs
 *   node scripts/import-contractors.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import {
  formatPhone,
  isContractorCategory,
  optionalString,
  parseNumber,
  parseSocials,
  resolveWaOrIdLocation,
  slugify,
  titleCaseCity,
} from "./import-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const csvPath = path.join(root, "spokane_directory - Sheet1.csv");
const reportPath = path.join(root, "import-report.json");
const dryRun = process.argv.includes("--dry-run");
const BATCH_SIZE = 50;

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

async function readCsvRows() {
  const rows = [];
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      bom: true,
    }),
  );
  for await (const row of parser) {
    rows.push(row);
  }
  return rows;
}

function mapRow(row, slug, location) {
  const cityRaw = location.city || optionalString(row.City);
  const rating = parseNumber(row.Rating);
  const reviewCount = parseNumber(row.Reviews);
  const rank = parseNumber(row["Google Maps Rank"]) ?? 0;

  return {
    slug,
    name: row.Name.trim(),
    googleCid: String(row.google_cid).trim(),
    googleMapsRank: rank,
    category: row.Category.trim(),
    city: cityRaw ? titleCaseCity(cityRaw) : undefined,
    state: location.state,
    website: optionalString(row.Website),
    gbpUrl: row["GBP URL"].trim(),
    phone:
      formatPhone(row["Phone 1"]) ||
      formatPhone(row["GBP Phone"]) ||
      undefined,
    email: optionalString(row.Email) || optionalString(row["Email 1"]),
    address: optionalString(row.Address),
    rating,
    reviewCount,
    claimed: String(row.Claimed).trim().toLowerCase() === "yes",
    logoUrl: optionalString(row["Logo URL"]),
    mainImageUrl: optionalString(row["Main Image URL"]),
    socials: parseSocials(row.Socials ?? ""),
    sourceUpdatedAt: Date.now(),
  };
}

async function main() {
  console.log(`Reading ${csvPath}`);
  const rows = await readCsvRows();
  console.log(`CSV rows: ${rows.length}`);

  const kept = [];
  const dropped = [];
  const droppedByCategory = new Map();
  const droppedByState = new Map();
  const slugCounts = new Map();

  for (const row of rows) {
    const category = (row.Category ?? "").trim();
    const name = (row.Name ?? "").trim();
    if (!name || !category) {
      dropped.push({ name, category, reason: "missing name or category" });
      continue;
    }
    if (!isContractorCategory(category)) {
      dropped.push({ name, category, reason: "non-contractor category" });
      droppedByCategory.set(
        category,
        (droppedByCategory.get(category) ?? 0) + 1,
      );
      continue;
    }

    const location = resolveWaOrIdLocation(row.State, row.City);
    if (!location) {
      const stateLabel = (row.State ?? "").trim() || "(blank)";
      dropped.push({
        name,
        category,
        state: stateLabel,
        reason: "outside WA/ID",
      });
      droppedByState.set(stateLabel, (droppedByState.get(stateLabel) ?? 0) + 1);
      continue;
    }

    let base = slugify(name) || "contractor";
    const cid = String(row.google_cid ?? "").trim();
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const slug =
      seen === 0
        ? base
        : `${base}-${cid.slice(-6) || String(seen + 1)}`;

    kept.push(mapRow(row, slug, location));
  }

  // Second pass: ensure unique slugs when first occurrence later collides conceptually
  const usedSlugs = new Set();
  for (const contractor of kept) {
    let slug = contractor.slug;
    if (usedSlugs.has(slug)) {
      slug = `${slugify(contractor.name)}-${contractor.googleCid.slice(-6)}`;
    }
    usedSlugs.add(slug);
    contractor.slug = slug;
  }

  const report = {
    totalRows: rows.length,
    kept: kept.length,
    dropped: dropped.length,
    droppedByCategory: Object.fromEntries(
      [...droppedByCategory.entries()].sort((a, b) => b[1] - a[1]),
    ),
    droppedByState: Object.fromEntries(
      [...droppedByState.entries()].sort((a, b) => b[1] - a[1]),
    ),
    sampleDropped: dropped.slice(0, 40),
    generatedAt: new Date().toISOString(),
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Kept ${kept.length}, dropped ${dropped.length}`);
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
