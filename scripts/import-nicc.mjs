#!/usr/bin/env node
/**
 * Import North Idaho Contractor Connection directory listings.
 * Skips businesses already present (matched by phone digits or name fingerprint).
 *
 * Usage:
 *   node scripts/import-nicc.mjs --dry-run
 *   node scripts/import-nicc.mjs
 */
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatPhone,
  normalizeCity,
  slugify,
} from "./import-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SOURCE = "northidahocc.com";
const DIRECTORY_URL = "https://www.northidahocc.com/directory";
const reportPath = path.join(root, "nicc-import-report.json");
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

function decodeHtml(value) {
  return String(value)
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8203;/g, "")
    .replace(/\u200b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneDigits(value) {
  if (!value) return undefined;
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : undefined;
}

function nameFingerprint(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function inferCategory(name) {
  const lower = name.toLowerCase();
  if (/heat|cool|hvac|furnace|air conditioning/.test(lower)) {
    return "HVAC contractor";
  }
  if (/electric/.test(lower)) return "Electrician";
  if (/plumb|rooter/.test(lower)) return "Plumber";
  if (/roof/.test(lower)) return "Roofing contractor";
  if (/paint/.test(lower)) return "Painter";
  if (/landscap|fence|excav|dirt|landwork/.test(lower)) {
    return "Landscaper";
  }
  if (/concrete|asphalt|paving/.test(lower)) return "Concrete contractor";
  if (/floor|tile|stone|granite|drywall|interior/.test(lower)) {
    return "Remodeler";
  }
  if (/insulat/.test(lower)) return "Insulation contractor";
  if (/tree|arbor/.test(lower)) return "Tree service";
  if (/window|siding/.test(lower)) return "Siding contractor";
  if (/pressure wash/.test(lower)) return "Handyman";
  if (/auto|diesel|mobile repair|fabrication/.test(lower)) {
    return "Automotive repair";
  }
  if (/build|construct|remodel|home repair|contractor/.test(lower)) {
    return "General contractor";
  }
  return "General contractor";
}

function parseLocation(addressRaw) {
  if (!addressRaw) return {};
  const raw = decodeHtml(addressRaw);
  if (/^serving\b/i.test(raw) || /^north idaho$/i.test(raw) || raw === ".") {
    return { state: "Idaho" };
  }

  const stateMatch = raw.match(/\b(ID|Idaho|WA|Washington)\b/i);
  let state;
  if (stateMatch) {
    const s = stateMatch[1].toLowerCase();
    state = s.startsWith("w") ? "Washington" : "Idaho";
  }

  // Prefer explicit city tokens before state.
  const cityState = raw.match(
    /(?:^|,\s*)([A-Za-z][A-Za-z .'-]+?)\s*,?\s*(ID|Idaho|WA|Washington)\b/i,
  );
  if (cityState) {
    let city = normalizeCity(cityState[1].replace(/\d+.*/, "").trim());
    if (city && /^(po box|p\.o\.|suite|ste|unit|north|serving)$/i.test(city)) {
      city = undefined;
    }
    return { city, state, address: raw };
  }

  // "Rathdrum ID"
  const short = raw.match(/^([A-Za-z][A-Za-z .'-]+)\s+(ID|Idaho|WA|Washington)\b/i);
  if (short) {
    return {
      city: normalizeCity(short[1]),
      state: short[2].toLowerCase().startsWith("w") ? "Washington" : "Idaho",
      address: raw,
    };
  }

  return { state: state ?? "Idaho", address: raw };
}

function parseLicense(licenseRaw) {
  if (!licenseRaw) return undefined;
  const cleaned = decodeHtml(licenseRaw)
    .replace(/^Lic\.?\s*\/?\s*Reg\.?\s*/i, "")
    .replace(/^Reg\.?\s*\/?\s*Lic\.?\s*/i, "")
    .replace(/^#\s*/, "")
    .trim();
  return cleaned || undefined;
}

function scrapeNiccHtml(html) {
  const h2Re =
    /id="([^"]+)"[^>]*class="[^"]*rich-text[^"]*"[\s\S]{0,160}?<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const items = [];
  let m;
  while ((m = h2Re.exec(html))) {
    const id = m[1];
    const uuid = (id.match(/__([0-9a-f-]{36})$/i) || [])[1];
    const name = decodeHtml(m[2]);
    if (!uuid || !name || name.length < 2) continue;
    items.push({ uuid, name, index: m.index });
  }

  return items.map(({ uuid, name, index }, i) => {
    const nextIndex = items[i + 1]?.index ?? index + 7000;
    const chunk = html.slice(index, nextIndex);
    const texts = [...chunk.matchAll(/<(?:h2|p)[^>]*>([\s\S]*?)<\/(?:h2|p)>/gi)]
      .map((x) => decodeHtml(x[1]))
      .filter(Boolean);

    const phoneRaw = texts
      .find((t) => /^Ph\./i.test(t))
      ?.replace(/^Ph\.\s*/i, "")
      .trim();
    const licenseRaw = texts.find((t) => /Lic|Reg\.|EIN/i.test(t));
    const address = texts.find(
      (t) =>
        t !== name &&
        !/^Ph\./i.test(t) &&
        t !== licenseRaw &&
        !/@/.test(t) &&
        !/^Website$/i.test(t) &&
        !/^Find us on Facebook$/i.test(t) &&
        t !== "." &&
        t.length > 1,
    );

    const uuidLinks = [
      ...chunk.matchAll(
        new RegExp(`id="[^"]*__${uuid}"[\\s\\S]{0,1200}?href="([^"]+)"`, "gi"),
      ),
    ].map((x) => x[1].replace(/&amp;/g, "&"));
    const links = [...new Set(uuidLinks)];
    const email = links
      .find((l) => l.startsWith("mailto:"))
      ?.replace(/^mailto:/i, "");
    const website = links.find(
      (l) =>
        /^https?:/i.test(l) &&
        !/facebook\.com|wixstatic|wix\.com|parastorage|northidahocc/i.test(l),
    );
    const facebook = links.find((l) => /facebook\.com/i.test(l));

    return {
      uuid,
      name,
      phoneRaw,
      address,
      licenseRaw,
      email,
      website,
      facebook,
    };
  });
}

function toContractor(listing, usedSlugs) {
  const location = parseLocation(listing.address);
  let base = slugify(listing.name) || "contractor";
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  usedSlugs.add(slug);

  const socials = [];
  if (listing.facebook) {
    socials.push({ platform: "facebook", url: listing.facebook });
  }

  const phone = formatPhone(listing.phoneRaw);
  const licenseNumber = parseLicense(listing.licenseRaw);

  return {
    slug,
    name: listing.name,
    googleCid: `nicc:${listing.uuid}`,
    googleMapsRank: 0,
    category: inferCategory(listing.name),
    city: location.city,
    state: location.state,
    website: listing.website,
    gbpUrl: undefined,
    phone,
    email: listing.email,
    address: location.address,
    claimed: false,
    socials,
    source: SOURCE,
    sourceUpdatedAt: Date.now(),
    ...(licenseNumber
      ? {
          licenseNumber,
          licenseState: location.state === "Washington" ? "WA" : "ID",
          licenseMatchedBy: "nicc-directory",
          licenseUpdatedAt: Date.now(),
        }
      : {}),
  };
}

async function main() {
  console.log(`Fetching ${DIRECTORY_URL}`);
  const res = await fetch(DIRECTORY_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const scraped = scrapeNiccHtml(html);
  console.log(`Scraped ${scraped.length} NICC listings`);

  const existing = runConvex("internal.contractors.listForEnrichment", {}) ?? [];
  const phones = new Set(
    existing.map((c) => phoneDigits(c.phone)).filter(Boolean),
  );
  const names = new Set(existing.map((c) => nameFingerprint(c.name)).filter(Boolean));
  const niccIds = new Set(
    existing
      .filter((c) => String(c.googleCid || "").startsWith("nicc:"))
      .map((c) => c.googleCid),
  );

  const skipped = [];
  const toInsert = [];
  const usedSlugs = new Set(existing.map((c) => c.slug).filter(Boolean));

  for (const listing of scraped) {
    const digits = phoneDigits(listing.phoneRaw);
    const fp = nameFingerprint(listing.name);
    const cid = `nicc:${listing.uuid}`;

    if (niccIds.has(cid)) {
      skipped.push({ name: listing.name, reason: "already imported from NICC" });
      continue;
    }
    if (digits && phones.has(digits)) {
      skipped.push({ name: listing.name, reason: "phone match", phone: listing.phoneRaw });
      continue;
    }
    if (fp && names.has(fp)) {
      skipped.push({ name: listing.name, reason: "name match" });
      continue;
    }

    toInsert.push(toContractor(listing, usedSlugs));
  }

  const report = {
    source: SOURCE,
    scraped: scraped.length,
    existing: existing.length,
    skipped: skipped.length,
    toInsert: toInsert.length,
    skippedSample: skipped.slice(0, 30),
    insertSample: toInsert.slice(0, 15).map((c) => ({
      name: c.name,
      phone: c.phone,
      city: c.city,
      state: c.state,
      category: c.category,
      website: c.website,
    })),
    generatedAt: new Date().toISOString(),
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `Skip ${skipped.length}, insert ${toInsert.length}. Wrote ${reportPath}`,
  );

  if (dryRun) {
    console.log("Dry run — skipping Convex insert");
    return;
  }

  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map((c) => {
      // upsertBatch validator: omit undefined gbpUrl by using empty then clear? use ""
      return {
        ...c,
        gbpUrl: c.gbpUrl ?? "",
        city: c.city ?? "",
      };
    });
    console.log(
      `Upserting batch ${i / BATCH_SIZE + 1}/${Math.ceil(toInsert.length / BATCH_SIZE)} (${batch.length})`,
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
