#!/usr/bin/env node
/**
 * Enrich contractors with WA L&I license numbers from data.wa.gov.
 *
 * Usage:
 *   node scripts/enrich-licenses.mjs
 *   node scripts/enrich-licenses.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "license-enrichment-report.json");
const dryRun = process.argv.includes("--dry-run");
const DATASET = "https://data.wa.gov/resource/m8qx-ubtq.json";
const PAGE_SIZE = 1000;
const BATCH_SIZE = 50;

const LEGAL_SUFFIXES = new Set([
  "llc",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "co",
  "company",
  "ltd",
  "limited",
  "pllc",
  "lp",
  "llp",
  "pc",
  "the",
  "dba",
  "and",
]);

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

function digitsPhone(value) {
  if (value === undefined || value === null) return "";
  let d = String(value).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : "";
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !LEGAL_SUFFIXES.has(w))
    .join(" ")
    .trim();
}

function statusRank(status) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return 0;
  if (s.includes("ACTIVE") || s === "RE-LICENSED") return 1;
  return 2;
}

function pickBest(records) {
  if (!records.length) return null;
  return [...records].sort((a, b) => {
    const sr = statusRank(a.contractorlicensestatus) - statusRank(b.contractorlicensestatus);
    if (sr !== 0) return sr;
    return String(b.licenseexpirationdate || "").localeCompare(
      String(a.licenseexpirationdate || ""),
    );
  })[0];
}

async function fetchPage(where, offset) {
  const url = new URL(DATASET);
  url.searchParams.set(
    "$select",
    [
      "businessname",
      "contractorlicensenumber",
      "phonenumber",
      "city",
      "state",
      "contractorlicensestatus",
      "licenseexpirationdate",
      "contractorlicensetypecodedesc",
    ].join(","),
  );
  url.searchParams.set("$where", where);
  url.searchParams.set("$limit", String(PAGE_SIZE));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$order", "contractorlicensenumber");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`L&I fetch failed ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

async function fetchAll(where, label) {
  const rows = [];
  let offset = 0;
  for (;;) {
    process.stdout.write(`\rFetching ${label}: ${rows.length}…`);
    const page = await fetchPage(where, offset);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  process.stdout.write(`\rFetched ${label}: ${rows.length}          \n`);
  return rows;
}

function toLicenseUpdate(id, record, matchedBy) {
  const expires = record.licenseexpirationdate
    ? String(record.licenseexpirationdate).slice(0, 10)
    : undefined;
  return {
    id,
    licenseNumber: record.contractorlicensenumber,
    licenseStatus: record.contractorlicensestatus || undefined,
    licenseType: record.contractorlicensetypecodedesc || undefined,
    licenseState: "WA",
    licenseExpiresAt: expires,
    licenseMatchedBy: matchedBy,
    licenseUpdatedAt: Date.now(),
  };
}

function namesSimilar(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(a.split(" "));
  const tb = new Set(b.split(" "));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  const minSize = Math.min(ta.size, tb.size);
  return minSize > 0 && overlap / minSize >= 0.7;
}

async function main() {
  console.log("Loading contractors from Convex…");
  const contractors = runConvex("internal.contractors.listForEnrichment", {});
  console.log(`Contractors: ${contractors.length}`);

  const eligible = contractors.filter((c) => (c.state || "").toLowerCase() !== "idaho");
  console.log(`Eligible (non-Idaho): ${eligible.length}`);

  const phoneRecords = await fetchAll(
    "phonenumber >= 5090000000 and phonenumber < 5100000000",
    "509-area licenses",
  );
  const cityRecords = await fetchAll(
    "upper(city) in('SPOKANE','SPOKANE VALLEY','LIBERTY LAKE','MEAD','CHENEY','AIRWAY HEIGHTS','VERADALE','COLBERT','NINE MILE FALLS','MEDICAL LAKE','OTIS ORCHARDS','GREENACRES','HAUSER','NEWMAN LAKE','DEER PARK','TUMTUM','ELK','ROCKFORD')",
    "Spokane-area city licenses",
  );

  const byLicense = new Map();
  for (const r of [...phoneRecords, ...cityRecords]) {
    if (r.contractorlicensenumber) byLicense.set(r.contractorlicensenumber, r);
  }
  const liRecords = [...byLicense.values()];
  console.log(`Unique L&I records indexed: ${liRecords.length}`);

  const byPhone = new Map();
  const byName = new Map();
  for (const r of liRecords) {
    const phone = digitsPhone(r.phonenumber);
    if (phone) {
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone).push(r);
    }
    const n = normalizeName(r.businessname);
    if (n) {
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(r);
    }
  }

  const updates = [];
  const ambiguous = [];
  const unmatched = [];

  for (const c of eligible) {
    const phone = digitsPhone(c.phone);
    const name = normalizeName(c.name);
    let match = null;
    let matchedBy = "";

    if (phone && byPhone.has(phone)) {
      const candidates = byPhone.get(phone);
      const nameFiltered = candidates.filter((r) =>
        namesSimilar(normalizeName(r.businessname), name),
      );
      const pool = nameFiltered.length ? nameFiltered : candidates;
      if (pool.length === 1 || (nameFiltered.length === 1)) {
        match = pickBest(nameFiltered.length === 1 ? nameFiltered : pool);
        matchedBy = nameFiltered.length ? "phone+name" : "phone";
      } else if (pool.length > 1) {
        const active = pool.filter(
          (r) => (r.contractorlicensestatus || "").toUpperCase() === "ACTIVE",
        );
        if (active.length === 1) {
          match = active[0];
          matchedBy = "phone+unique-active";
        } else {
          ambiguous.push({
            id: c._id,
            name: c.name,
            phone: c.phone,
            reason: `phone matched ${pool.length} licenses`,
          });
          continue;
        }
      }
    }

    if (!match && name && byName.has(name)) {
      const candidates = byName.get(name);
      const active = candidates.filter(
        (r) => (r.contractorlicensestatus || "").toUpperCase() === "ACTIVE",
      );
      const pool = active.length ? active : candidates;
      if (pool.length === 1) {
        match = pool[0];
        matchedBy = "exact-name";
      } else {
        const city = (c.city || "").toLowerCase();
        const cityHits = pool.filter(
          (r) => (r.city || "").toLowerCase() === city && city,
        );
        if (cityHits.length === 1) {
          match = cityHits[0];
          matchedBy = "exact-name+city";
        } else {
          ambiguous.push({
            id: c._id,
            name: c.name,
            phone: c.phone,
            reason: `name matched ${pool.length} licenses`,
          });
          continue;
        }
      }
    }

    if (match) {
      updates.push(toLicenseUpdate(c._id, match, matchedBy));
    } else {
      unmatched.push({ id: c._id, name: c.name, phone: c.phone, city: c.city });
    }
  }

  const report = {
    eligible: eligible.length,
    matched: updates.length,
    ambiguous: ambiguous.length,
    unmatched: unmatched.length,
    matchedBy: updates.reduce((acc, u) => {
      acc[u.licenseMatchedBy] = (acc[u.licenseMatchedBy] || 0) + 1;
      return acc;
    }, {}),
    sampleMatched: updates.slice(0, 15).map((u) => ({
      id: u.id,
      licenseNumber: u.licenseNumber,
      status: u.licenseStatus,
      matchedBy: u.licenseMatchedBy,
    })),
    sampleAmbiguous: ambiguous.slice(0, 20),
    sampleUnmatched: unmatched.slice(0, 20),
    generatedAt: new Date().toISOString(),
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `Matched ${updates.length}, ambiguous ${ambiguous.length}, unmatched ${unmatched.length}`,
  );
  console.log(`Wrote ${reportPath}`);

  if (dryRun) {
    console.log("Dry run — skipping Convex patch");
    return;
  }

  let patched = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    console.log(
      `Patching ${i / BATCH_SIZE + 1}/${Math.ceil(updates.length / BATCH_SIZE)} (${batch.length})`,
    );
    patched += runConvex("internal.contractors.patchLicenses", { updates: batch });
  }
  console.log(`Done. patched=${patched}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
