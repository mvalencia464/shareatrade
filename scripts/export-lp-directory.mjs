#!/usr/bin/env node
/**
 * Pull already-enriched campaign leads (GET only) and write stamped
 * directory JSON for P1–P5 metros. Does not start campaigns or POST /search.
 *
 * Usage:
 *   node scripts/export-lp-directory.mjs
 *   node scripts/export-lp-directory.mjs --from-cache
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

function places(slug, stateList, cities) {
  const states = new Set(stateList);
  return cities.map((city) => ({ slug, city, states }));
}

const RING_PLACES = [
  ...places("boise", ["id", "idaho"], [
    "boise",
    "meridian",
    "eagle",
    "nampa",
    "garden city",
    "kuna",
    "star",
  ]),
  ...places("raleigh", ["nc", "north carolina"], [
    "raleigh",
    "cary",
    "apex",
    "fuquay-varina",
    "fuquay varina",
    "garner",
    "wake forest",
    "holly springs",
    "durham",
    "clayton",
    "youngsville",
  ]),
  ...places("portland", ["or", "oregon"], [
    "portland",
    "beaverton",
    "hillsboro",
    "tigard",
    "lake oswego",
    "gresham",
  ]),
  ...places("portland", ["wa", "washington"], ["vancouver"]),
  ...places("indianapolis", ["in", "indiana"], [
    "indianapolis",
    "carmel",
    "fishers",
    "noblesville",
    "greenwood",
    "westfield",
    "zionsville",
  ]),
  ...places("kansas-city", ["ks", "kansas", "mo", "missouri"], [
    "kansas city",
    "overland park",
    "lenexa",
    "olathe",
    "lee's summit",
    "lees summit",
    "shawnee",
  ]),
  ...places("nashville", ["tn", "tennessee"], [
    "nashville",
    "franklin",
    "murfreesboro",
    "brentwood",
    "hendersonville",
    "gallatin",
    "smyrna",
    "goodlettsville",
    "spring hill",
    "columbia",
    "thompson's station",
    "thompsons station",
    "chapel hill",
  ]),
  ...places("charlotte", ["nc", "north carolina"], [
    "charlotte",
    "concord",
    "mooresville",
    "cornelius",
    "matthews",
    "huntersville",
    "waxhaw",
    "kannapolis",
    "indian trail",
  ]),
  ...places("charlotte", ["sc", "south carolina"], ["rock hill", "fort mill"]),
  ...places("salt-lake", ["ut", "utah"], [
    "salt lake city",
    "sandy",
    "south jordan",
    "west jordan",
    "draper",
    "lehi",
    "midvale",
    "provo",
    "orem",
    "riverton",
    "murray",
    "bluffdale",
  ]),
  ...places("columbus", ["oh", "ohio"], [
    "columbus",
    "westerville",
    "dublin",
    "hilliard",
    "worthington",
  ]),
  ...places("denver", ["co", "colorado"], [
    "denver",
    "littleton",
    "castle rock",
    "parker",
    "arvada",
    "centennial",
    "englewood",
    "westminster",
    "broomfield",
    "lakewood",
    "wheat ridge",
    "aurora",
    "highlands ranch",
    "thornton",
  ]),
  ...places("phoenix", ["az", "arizona"], [
    "phoenix",
    "gilbert",
    "chandler",
    "mesa",
    "peoria",
    "surprise",
    "queen creek",
    "buckeye",
    "glendale",
    "goodyear",
    "avondale",
    "tempe",
  ]),
  ...places("atlanta", ["ga", "georgia"], [
    "atlanta",
    "marietta",
    "alpharetta",
    "roswell",
    "woodstock",
    "kennesaw",
    "lawrenceville",
    "peachtree city",
    "norcross",
    "newnan",
    "suwanee",
    "acworth",
    "duluth",
    "johns creek",
    "peachtree corners",
    "dacula",
    "buford",
    "cumming",
    "lilburn",
  ]),
  ...places("northern-virginia", ["va", "virginia"], [
    "sterling",
    "ashburn",
    "leesburg",
    "fairfax",
    "manassas",
    "woodbridge",
    "reston",
    "herndon",
  ]),
  ...places("minneapolis", ["mn", "minnesota"], [
    "minneapolis",
    "plymouth",
    "maple grove",
    "eden prairie",
    "woodbury",
    "bloomington",
    "st louis park",
    "st. louis park",
    "brooklyn park",
    "minnetonka",
    "golden valley",
  ]),
  ...places("milwaukee", ["wi", "wisconsin"], [
    "milwaukee",
    "waukesha",
    "brookfield",
    "new berlin",
    "west allis",
    "wauwatosa",
  ]),
  ...places("huntsville", ["al", "alabama"], ["huntsville", "madison"]),
  ...places("richmond", ["va", "virginia"], [
    "richmond",
    "midlothian",
    "mechanicsville",
    "glen allen",
    "henrico",
  ]),
  ...places("charleston", ["sc", "south carolina"], [
    "charleston",
    "mount pleasant",
    "mt pleasant",
    "mt. pleasant",
    "north charleston",
    "summerville",
  ]),
  ...places("omaha", ["ne", "nebraska"], [
    "omaha",
    "papillion",
    "la vista",
    "bellevue",
    "ralston",
    "springfield",
  ]),
  ...places("omaha", ["ia", "iowa"], ["council bluffs"]),
  ...places("oklahoma-city", ["ok", "oklahoma"], ["oklahoma city", "edmond"]),
  ...places("birmingham", ["al", "alabama"], ["birmingham", "hoover"]),
  ...places("greenville", ["sc", "south carolina"], ["greenville", "simpsonville"]),
  ...places("des-moines", ["ia", "iowa"], ["des moines", "ankeny"]),
  ...places("seattle", ["wa", "washington"], [
    "seattle",
    "everett",
    "puyallup",
    "snohomish",
    "lake stevens",
    "marysville",
    "kirkland",
    "bellevue",
    "redmond",
  ]),
  ...places("chicago", ["il", "illinois"], [
    "chicago",
    "naperville",
    "schaumburg",
    "hoffman estates",
  ]),
  ...places("cincinnati", ["oh", "ohio"], [
    "cincinnati",
    "loveland",
    "mason",
    "west chester",
    "west chester township",
  ]),
  ...places("tulsa", ["ok", "oklahoma"], ["tulsa", "broken arrow"]),
  ...places("detroit", ["mi", "michigan"], [
    "detroit",
    "novi",
    "livonia",
    "farmington hills",
    "southfield",
    "wixom",
    "plymouth",
    "farmington",
    "northville",
    "commerce township",
    "redford township",
    "redford",
    "new hudson",
    "walled lake",
  ]),
];

const RING_SLUGS = [...new Set(RING_PLACES.map((place) => place.slug))];

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
  for (const place of RING_PLACES) {
    if (place.city === cityKey && place.states.has(st)) return place.slug;
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
    if (page > 200) break;
    await sleep(80);
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
  if (typeof searched === "string") {
    const place = parsePlace(searched);
    return assignMarket(place.city, place.state);
  }
  const place = parsePlace(
    searched?.city || searched?.name || searched?.cities?.[0] || "",
  );
  const state = place.state || searched?.state_code || searched?.state || "";
  return assignMarket(place.city, state);
}

async function main() {
  loadEnvFiles(root);
  const apiKey = process.env.LOCALPROSPECTS_API_KEY;
  if (!apiKey) {
    throw new Error("Set LOCALPROSPECTS_API_KEY in .env.local or .env");
  }

  mkdirSync(exportDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const campaigns = fromCache
    ? readdirSync(cacheDir)
        .filter((name) => name.startsWith("campaign-") && name.endsWith("-leads.json"))
        .map((name) => ({
          id: name.slice("campaign-".length, -"-leads.json".length),
          name: name,
          status: "cached",
        }))
    : await listCampaigns(apiKey);
  const byMarket = Object.fromEntries(RING_SLUGS.map((slug) => [slug, []]));
  const seenCid = Object.fromEntries(RING_SLUGS.map((slug) => [slug, new Set()]));
  const summary = {
    campaigns: campaigns.length,
    pulled: 0,
    skippedReady: 0,
    unmatched: 0,
    nonContractor: 0,
    badCid: 0,
    unmatchedCities: {},
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
    console.log(`Fetching leads ${campaign.name} (${status}) ${id}`);
    const businesses = await fetchCampaignLeads(apiKey, id);
    console.log(`  ${businesses.length} businesses`);
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
        const contact = row.contact ?? {};
        let city = String(contact.city ?? "").trim();
        let state = String(contact.state_code || contact.state || "").trim();
        if (!city) {
          const searched = row.searched_location;
          const raw =
            typeof searched === "string"
              ? searched
              : searched?.city || searched?.name || "";
          const place = parsePlace(raw);
          city = place.city;
          state = place.state || searched?.state_code || searched?.state || "";
        }
        const key = `${city || "(no city)"}, ${state || "(no state)"}`;
        summary.unmatchedCities[key] = (summary.unmatchedCities[key] ?? 0) + 1;
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
      keptRing: kept,
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

  const unmatchedTop = Object.entries(summary.unmatchedCities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60);
  const byState = {};
  for (const [place, count] of Object.entries(summary.unmatchedCities)) {
    const state = place.split(", ").at(-1) ?? "";
    byState[state] = (byState[state] ?? 0) + count;
  }
  console.log(
    JSON.stringify(
      {
        ...summary,
        unmatchedCities: Object.fromEntries(unmatchedTop),
        unmatchedByState: Object.fromEntries(
          Object.entries(byState).sort((a, b) => b[1] - a[1]),
        ),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
