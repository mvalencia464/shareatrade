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
  formatPhone,
  isContractorCategory,
  normalizeCity,
  resolveWaOrIdLocation,
  slugify,
} from "./import-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SOURCE = "localprospects";
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

function hostnameFromDomain(value) {
  const raw = String(value).trim();
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./, "").toLowerCase();
  }
}

function socialsFromWeb(socials) {
  if (!socials || typeof socials !== "object") return [];
  return Object.entries(socials)
    .filter(([, url]) => typeof url === "string" && url.startsWith("http"))
    .map(([platform, url]) => ({
      platform: platform.toLowerCase(),
      url,
    }));
}

function inferCategory(business, domain) {
  const category = String(business.category ?? "").trim();
  if (isContractorCategory(category)) return category;

  const blob = [
    business.name,
    domain,
    business.website,
    business.web?.meta_description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (blob.includes("deck")) return "Deck builder";
  return category;
}

function cidFromSchema(business) {
  const schemas = business.web?.schema_org;
  if (!Array.isArray(schemas)) return undefined;
  for (const schema of schemas) {
    const mapUrl = schema?.hasMap;
    if (typeof mapUrl !== "string") continue;
    const hex = mapUrl.match(/:0x([0-9a-f]+)/i)?.[1];
    if (hex) return BigInt(`0x${hex}`).toString();
  }
  return undefined;
}

function mapBusiness(business, domain) {
  const contact = business.contact ?? {};
  const reputation = business.reputation ?? {};
  const name = String(business.name ?? "").trim();
  const category = inferCategory(business, domain);
  const host = hostnameFromDomain(domain);
  const googleCid =
    String(
      business.google_cid ?? business.googleCid ?? business.cid ?? "",
    ).trim() ||
    cidFromSchema(business) ||
    `lp:${host}`;
  const gbpUrl =
    business.gbp_url ||
    (googleCid.startsWith("lp:")
      ? undefined
      : `https://www.google.com/maps?cid=${googleCid}`);

  const location = resolveWaOrIdLocation(
    contact.state_code || contact.state,
    contact.city,
  );

  return {
    name,
    category,
    location,
    contractor: {
      slug: slugify(name) || slugify(host) || "contractor",
      name,
      googleCid,
      googleMapsRank: Number(business.rank) || 0,
      category,
      city: normalizeCity(contact.city) ?? "",
      state: location?.state,
      website: business.website || `https://${host}`,
      gbpUrl: gbpUrl || undefined,
      phone: formatPhone(business.phone),
      email: business.email || undefined,
      address: contact.address || undefined,
      rating:
        typeof reputation.rating === "number" ? reputation.rating : undefined,
      reviewCount:
        typeof reputation.reviews === "number" ? reputation.reviews : undefined,
      claimed: Boolean(reputation.is_claimed),
      logoUrl: business.logo || undefined,
      mainImageUrl: business.main_image || undefined,
      socials: socialsFromWeb(business.web?.socials),
      source: SOURCE,
      sourceUpdatedAt: Date.now(),
    },
  };
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
