#!/usr/bin/env node
/**
 * Pull already-enriched campaign leads (GET only) and write stamped
 * directory JSON for P1 metros. Does not start campaigns or POST /search.
 *
 * Usage:
 *   node scripts/export-lp-directory.mjs
 *   node scripts/export-lp-directory.mjs --from-cache
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatPhone, isContractorCategory, normalizeCity } from "./import-lib.mjs";
import { loadEnvFiles } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const API_BASE = "https://localprospects.ai/api/v1";
const cacheDir = path.join(root, "localprospects-search-cache");
const exportDir = path.join(root, "exports");
const fromCache = process.argv.includes("--from-cache");

const P1 = [
  {
    slug: "boise",
    states: new Set(["id", "idaho"]),
    cities: new Set([
      "boise",
      "meridian",
      "eagle",
      "nampa",
      "garden city",
      "kuna",
      "star",
    ]),
  },
  {
    slug: "raleigh",
    states: new Set(["nc", "north carolina"]),
    cities: new Set([
      "raleigh",
      "cary",
      "apex",
      "fuquay-varina",
      "fuquay varina",
      "garner",
      "wake forest",
      "holly springs",
      "durham",
    ]),
  },
  {
    slug: "portland",
    states: new Set(["or", "oregon", "wa", "washington"]),
    cities: new Set([
      "portland",
      "beaverton",
      "hillsboro",
      "tigard",
      "lake oswego",
      "gresham",
      "vancouver",
    ]),
  },
];

function norm(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stateKey(value) {
  return norm(value);
}

function parsePlace(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { city: "", state: "" };
  const parts = text.split(",").map((part) => part.trim());
  if (parts.length >= 2) {
    return { city: parts[0], state: parts[parts.length - 1] };
  }
  return { city: text, state: "" };
}

function assignMarket(city, state) {
  const cityKey = norm(city);
  const st = stateKey(state);
  if (!cityKey || !st) return null;

  if (cityKey === "vancouver") {
    return st === "wa" || st === "washington" ? "portland" : null;
  }
  if (
    ["portland", "beaverton", "hillsboro", "tigard", "lake oswego", "gresham"].includes(
      cityKey,
    )
  ) {
    return st === "or" || st === "oregon" ? "portland" : null;
  }

  for (const market of P1) {
    if (!market.cities.has(cityKey) || !market.states.has(st)) continue;
    if (market.slug === "portland") continue;
    return market.slug;
  }
  return null;
}

function socialsFromWeb(socials) {
  if (!socials || typeof socials !== "object") return undefined;
  const items = Object.entries(socials)
    .filter(([, url]) => typeof url === "string" && url.startsWith("http"))
    .map(([platform, url]) => ({
      platform: platform.toLowerCase(),
      url,
    }));
  return items.length ? items : undefined;
}

function omitEmpty(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

function toListing(row, marketSlug) {
  const contact = row.contact ?? {};
  const reputation = row.reputation ?? {};
  const googleCid = String(row.google_cid ?? row.cid ?? "").trim();
  const category = String(row.category ?? "").trim();
  const name = String(row.name ?? "").trim();
  const listing = omitEmpty({
    marketSlug,
    googleCid,
    name,
    category,
    city: normalizeCity(contact.city) ?? undefined,
    state: contact.state_code || contact.state || undefined,
    phone: formatPhone(row.phone) ?? undefined,
    website: row.website || undefined,
    gbpUrl: row.gbp_url || (googleCid ? `https://www.google.com/maps?cid=${googleCid}` : undefined),
    rating: typeof reputation.rating === "number" ? reputation.rating : undefined,
    reviewCount:
      typeof reputation.reviews === "number"
        ? reputation.reviews
        : typeof reputation.review_count === "number"
          ? reputation.review_count
          : undefined,
    claimed: Boolean(reputation.is_claimed ?? row.claimed),
    logoUrl: row.logo || undefined,
    mainImageUrl: row.main_image || undefined,
    socials: socialsFromWeb(row.web?.socials),
    googleMapsRank: typeof row.rank === "number" ? row.rank : undefined,
  });
  return listing;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiGet(apiKey, pathname) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    headers: { "x-api-key": apiKey },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed (${response.status})`);
  }
  return body;
}

async function listCampaigns(apiKey) {
  const all = [];
  let page = 1;
  for (;;) {
    const body = await apiGet(apiKey, `/campaigns?page=${page}&page_size=50`);
    const rows = body.campaigns ?? [];
    all.push(...rows);
    if (rows.length === 0 || all.length >= (body.total ?? all.length)) break;
    page += 1;
    if (page > 20) break;
  }
  return all;
}

async function fetchCampaignLeads(apiKey, campaignId) {
  const cachePath = path.join(cacheDir, `campaign-${campaignId}-leads.json`);
  if (fromCache && existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, "utf8"));
  }
  const businesses = [];
  let page = 1;
  for (;;) {
    const body = await apiGet(
      apiKey,
      `/campaigns/${campaignId}/leads?page=${page}&page_size=100`,
    );
    const batch = body.businesses ?? [];
    businesses.push(...batch);
    if (!body.has_more || batch.length === 0) break;
    page += 1;
    await sleep(120);
  }
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(businesses));
  return businesses;
}

function marketForRow(row) {
  const contact = row.contact ?? {};
  const fromListing = assignMarket(contact.city, contact.state_code || contact.state);
  if (fromListing) return fromListing;
  const searched = row.searched_location;
  const place =
    typeof searched === "string"
      ? parsePlace(searched)
      : parsePlace(searched?.name || searched?.cities?.[0] || "");
  return assignMarket(place.city, place.state);
}

async function main() {
  loadEnvFiles(root);
  const apiKey = process.env.LOCALPROSPECTS_API_KEY;
  if (!apiKey) {
    throw new Error("Set LOCALPROSPECTS_API_KEY in .env.local or .env");
  }

  mkdirSync(exportDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const campaigns = await listCampaigns(apiKey);
  const byMarket = { boise: [], raleigh: [], portland: [] };
  const seenCid = { boise: new Set(), raleigh: new Set(), portland: new Set() };
  const summary = {
    campaigns: campaigns.length,
    pulled: 0,
    skippedReady: 0,
    unmatched: 0,
    nonContractor: 0,
    badCid: 0,
    byCampaign: [],
  };

  for (const campaign of campaigns) {
    const status = String(campaign.status ?? "");
    if (status === "ready" || status === "draft") {
      summary.skippedReady += 1;
      continue;
    }
    const id = campaign.id || campaign.campaign_id;
    if (!id) continue;
    const businesses = await fetchCampaignLeads(apiKey, id);
    summary.pulled += businesses.length;
    let kept = 0;
    for (const row of businesses) {
      const category = String(row.category ?? "").trim();
      const googleCid = String(row.google_cid ?? row.cid ?? "").trim();
      if (!/^\d+$/.test(googleCid)) {
        summary.badCid += 1;
        continue;
      }
      if (!isContractorCategory(category)) {
        summary.nonContractor += 1;
        continue;
      }
      const marketSlug = marketForRow(row);
      if (!marketSlug) {
        summary.unmatched += 1;
        continue;
      }
      if (seenCid[marketSlug].has(googleCid)) continue;
      seenCid[marketSlug].add(googleCid);
      byMarket[marketSlug].push(toListing(row, marketSlug));
      kept += 1;
    }
    summary.byCampaign.push({
      id,
      name: campaign.name,
      keyword: campaign.keyword,
      status,
      businesses: businesses.length,
      keptP1: kept,
    });
  }

  for (const slug of Object.keys(byMarket)) {
    const listings = byMarket[slug];
    const file = path.join(exportDir, `directory-${slug}.json`);
    writeFileSync(
      file,
      JSON.stringify(
        {
          marketSlug: slug,
          source: "localprospects-campaign-leads",
          generatedAt: new Date().toISOString(),
          listings,
        },
        null,
        2,
      ),
    );
    console.log(`Wrote ${listings.length} ${slug} listings to ${file}`);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
