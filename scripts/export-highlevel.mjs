#!/usr/bin/env node
/**
 * Upsert directory contractors into HighLevel as contacts.
 *
 * Usage:
 *   node scripts/export-highlevel.mjs --dry-run
 *   node scripts/export-highlevel.mjs --limit=5
 *   node scripts/export-highlevel.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARKET_GEO, tzTagForTimezone } from "./hl-markets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";
const LIST_TAG = "shareatrade-list";
const CRM_MARKETS = [
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
  "denver",
  "phoenix",
  "atlanta",
  "northern-virginia",
  "minneapolis",
  "milwaukee",
  "huntsville",
  "richmond",
  "charleston",
  "omaha",
  "oklahoma-city",
  "birmingham",
  "greenville",
  "des-moines",
  "seattle",
  "chicago",
  "cincinnati",
  "tulsa",
  "detroit",
];
const SITE_ORIGIN = "https://shareatrade.com";
const CUSTOM_FIELD_NAMES = [
  "reviews",
  "gbp url",
  "niche",
  "claimed",
  "rating",
  "shareatrade_url",
  "shareatrade_site",
];

const dryRun = process.argv.includes("--dry-run");
const fromStart = process.argv.includes("--from-start");
const checkpointPath = path.join(root, "exports", "hl-export-checkpoint.json");
const limitArg = process.argv
  .find((arg) => arg.startsWith("--limit="))
  ?.slice("--limit=".length);
const limit = limitArg ? Number(limitArg) : null;

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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toE164(value) {
  if (!value) return undefined;
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return undefined;
  return `+1${digits}`;
}

function splitName(name) {
  const trimmed = String(name ?? "").trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: undefined };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim() || undefined,
  };
}

function hlHeaders(token, locationId) {
  return {
    Authorization: `Bearer ${token}`,
    Version: API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Location-Id": locationId,
  };
}

async function hlFetch(token, locationId, pathname, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${pathname}`, {
      ...options,
      headers: { ...hlHeaders(token, locationId), ...options.headers },
    });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }
    return { ok: response.ok, status: response.status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, body: { message } };
  }
}

function fieldKeys(field) {
  const raw = [
    field.name,
    field.fieldKey,
    field.key,
    String(field.fieldKey ?? "").split(".").at(-1),
  ];
  return new Set(
    raw
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
}

function shareatradeUrl(marketSlug, slug) {
  return `${SITE_ORIGIN}/${marketSlug}/${slug}`;
}

function shareatradeSite(marketSlug, slug) {
  return `${SITE_ORIGIN}/go/${marketSlug}/${slug}`;
}

async function loadCustomFieldMap(token, locationId) {
  const { ok, status, body } = await hlFetch(
    token,
    locationId,
    `/locations/${locationId}/customFields`,
  );
  if (!ok) {
    throw new Error(
      `Failed to load custom fields (${status}): ${JSON.stringify(body)}`,
    );
  }
  const fields = body.customFields ?? body.fields ?? body.data ?? [];
  const mapped = {};
  const missing = [];
  for (const name of CUSTOM_FIELD_NAMES) {
    const match = fields.find(
      (field) => field.id && fieldKeys(field).has(name),
    );
    if (match) mapped[name] = match.id;
    else missing.push(name);
  }
  if (missing.length) {
    console.warn(
      `Custom fields not found (will skip): ${missing.join(", ")}`,
    );
  }
  return mapped;
}

function mapContact(row, locationId, customIds) {
  const phone = toE164(row.phone);
  const email = String(row.email ?? "").trim() || undefined;
  if (!phone && !email) return null;

  const { firstName, lastName } = splitName(row.name);
  const customFields = [];
  if (customIds.niche && row.category) {
    customFields.push({ id: customIds.niche, value: row.category });
  }
  if (customIds["gbp url"] && row.gbpUrl) {
    customFields.push({ id: customIds["gbp url"], value: row.gbpUrl });
  }
  if (customIds.rating && typeof row.rating === "number") {
    customFields.push({ id: customIds.rating, value: String(row.rating) });
  }
  if (customIds.reviews && typeof row.reviewCount === "number") {
    customFields.push({
      id: customIds.reviews,
      value: String(row.reviewCount),
    });
  }
  if (customIds.claimed) {
    customFields.push({
      id: customIds.claimed,
      value: row.claimed ? "Yes" : "No",
    });
  }
  if (
    customIds.shareatrade_url &&
    row.marketSlug &&
    row.slug
  ) {
    customFields.push({
      id: customIds.shareatrade_url,
      value: shareatradeUrl(row.marketSlug, row.slug),
    });
  }
  if (
    customIds.shareatrade_site &&
    row.marketSlug &&
    row.slug
  ) {
    customFields.push({
      id: customIds.shareatrade_site,
      value: shareatradeSite(row.marketSlug, row.slug),
    });
  }

  const geo = MARKET_GEO[row.marketSlug];
  const city = String(row.city ?? "").trim() || geo?.city;
  const state = String(row.state ?? "").trim() || geo?.state;
  const timezone = geo?.timezone ?? "America/Los_Angeles";
  const payload = {
    locationId,
    firstName,
    companyName: row.name,
    source: "Share a Trade",
    timezone,
    country: "US",
    tags: [LIST_TAG, row.marketSlug, tzTagForTimezone(timezone)].filter(Boolean),
  };
  if (lastName) payload.lastName = lastName;
  if (phone) payload.phone = phone;
  if (email) payload.email = email;
  if (row.website) payload.website = row.website;
  if (city) payload.city = city;
  if (state) payload.state = state;
  if (row.address) payload.address1 = row.address;
  if (customFields.length) payload.customFields = customFields;
  return payload;
}

async function upsertContact(token, locationId, payload) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { ok, status, body } = await hlFetch(token, locationId, "/contacts/upsert", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (status === 0 || status === 429 || status === 502 || status === 503 || status === 524) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!ok) {
      const message =
        body?.message ?? body?.error ?? JSON.stringify(body ?? {});
      return { ok: false, status, message: String(message).slice(0, 300) };
    }
    const newContact = Boolean(
      body?.new ?? body?.created ?? body?.contact?.new,
    );
    return { ok: true, created: newContact, status };
  }
  return { ok: false, status: 429, message: "Rate limited after retries" };
}

function loadCrmRows(maxRows) {
  const rows = [];
  for (const marketSlug of CRM_MARKETS) {
    console.log(`Loading ${marketSlug}…`);
    const page = runConvex("internal.contractors.listForCrmByMarket", {
      marketSlug,
    });
    if (!Array.isArray(page)) {
      throw new Error(`listForCrmByMarket did not return an array for ${marketSlug}`);
    }
    rows.push(...page);
    if (maxRows && rows.length >= maxRows) return rows.slice(0, maxRows);
  }
  return rows;
}

async function main() {
  loadEnvLocal();
  const token = process.env.HIGHLEVEL_TOKEN;
  const locationId = process.env.HIGHLEVEL_LOCATION_ID;
  if (!token) throw new Error("Set HIGHLEVEL_TOKEN in .env.local");
  if (!locationId) throw new Error("Set HIGHLEVEL_LOCATION_ID in .env.local");
  if (limit !== null && (!Number.isFinite(limit) || limit < 1)) {
    throw new Error(`Invalid --limit=${limitArg}`);
  }

  console.log("Loading contractors from Convex…");
  let rows = loadCrmRows(limit);
  if (!Array.isArray(rows)) {
    throw new Error("listForCrm did not return an array");
  }

  const skippedNoContact = rows.filter(
    (row) => !toE164(row.phone) && !String(row.email ?? "").trim(),
  ).length;
  rows = rows.filter(
    (row) => toE164(row.phone) || String(row.email ?? "").trim(),
  );
  if (limit) rows = rows.slice(0, limit);

  let customIds = {};
  try {
    customIds = await loadCustomFieldMap(token, locationId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (dryRun) {
      console.warn(message);
      console.warn(
        "Dry run continuing without custom field IDs. For a live sync, create a Private Integration token with contacts.write and locations/customFields.readonly, then set HIGHLEVEL_TOKEN.",
      );
    } else {
      throw new Error(
        `${message} Create a Private Integration in HighLevel (contacts.write, locations.readonly, locations/customFields.readonly) and update HIGHLEVEL_TOKEN.`,
      );
    }
  }
  const payloads = rows
    .map((row) => mapContact(row, locationId, customIds))
    .filter(Boolean);

  console.log(
    JSON.stringify(
      {
        dryRun,
        totalWithContact: rows.length,
        skippedNoPhoneOrEmail: skippedNoContact,
        customFieldIdsResolved: Object.keys(customIds),
        sample: payloads.slice(0, 3).map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          companyName: p.companyName,
          city: p.city,
          tags: p.tags,
          hasPhone: Boolean(p.phone),
          hasEmail: Boolean(p.email),
          customFieldCount: p.customFields?.length ?? 0,
          shareatradeUrl: p.customFields?.find(
            (field) => field.id === customIds.shareatrade_url,
          )?.value,
          shareatradeSite: p.customFields?.find(
            (field) => field.id === customIds.shareatrade_site,
          )?.value,
        })),
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run — skipping HighLevel upserts");
    return;
  }

  mkdirSync(path.dirname(checkpointPath), { recursive: true });
  let startIndex = 0;
  if (!fromStart && existsSync(checkpointPath)) {
    try {
      const saved = JSON.parse(readFileSync(checkpointPath, "utf8"));
      if (Number.isInteger(saved.nextIndex) && saved.nextIndex > 0) {
        startIndex = Math.min(saved.nextIndex, payloads.length);
      }
    } catch {
      startIndex = 0;
    }
  }
  if (startIndex > 0) {
    console.log(`Resuming from contact ${startIndex + 1}/${payloads.length}`);
  }

  let created = 0;
  let updated = 0;
  let errors = 0;
  for (let i = startIndex; i < payloads.length; i += 1) {
    const result = await upsertContact(token, locationId, payloads[i]);
    if (!result.ok) {
      errors += 1;
      console.error(
        `Error ${i + 1}/${payloads.length} (${payloads[i].companyName}): ${result.status} ${result.message}`,
      );
    } else if (result.created) {
      created += 1;
    } else {
      updated += 1;
    }
    if ((i + 1) % 50 === 0 || i + 1 === payloads.length) {
      writeFileSync(
        checkpointPath,
        JSON.stringify({ nextIndex: i + 1, updatedAt: new Date().toISOString() }),
      );
      console.log(
        `Progress ${i + 1}/${payloads.length} created=${created} updated=${updated} errors=${errors}`,
      );
    }
    await sleep(80);
  }

  if (existsSync(checkpointPath)) unlinkSync(checkpointPath);
  console.log(
    JSON.stringify({ created, updated, errors, total: payloads.length }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
