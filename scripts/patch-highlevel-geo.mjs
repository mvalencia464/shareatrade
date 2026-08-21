#!/usr/bin/env node
/**
 * Fill missing HighLevel city/state from the metro tag, set IANA timezone,
 * or add simplified timezone tags (EDT, PDT, CDT, MDT, MST).
 *
 * Usage:
 *   node scripts/patch-highlevel-geo.mjs --dry-run
 *   node scripts/patch-highlevel-geo.mjs --limit=20
 *   node scripts/patch-highlevel-geo.mjs --timezones
 *   node scripts/patch-highlevel-geo.mjs --tz-tags --dry-run
 *   node scripts/patch-highlevel-geo.mjs --tz-tags
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARKET_GEO, TZ_TAG_NAMES, geoFromTags, tzTagForTimezone } from "./hl-markets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";
const LIST_TAG = "shareatrade-list";

const dryRun = process.argv.includes("--dry-run");
const timezoneOnly = process.argv.includes("--timezones");
const tzTagsOnly = process.argv.includes("--tz-tags");
const PACIFIC = "America/Los_Angeles";
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function searchFilters() {
  const filters = [{ field: "tags", operator: "eq", value: LIST_TAG }];
  if (timezoneOnly) {
    filters.push({ field: "timezone", operator: "eq", value: PACIFIC });
  } else {
    filters.push({ field: "city", operator: "not_exists" });
  }
  return filters;
}

async function searchContacts(token, locationId, page, pageLimit) {
  return hlFetch(token, locationId, "/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      page,
      pageLimit,
      filters: searchFilters(),
    }),
  });
}

async function loadAllMatching(token, locationId) {
  const byId = new Map();
  for (let page = 1; page <= 500; page += 1) {
    const result = await searchContacts(token, locationId, page, 100);
    if (!result.ok) {
      throw new Error(
        `Search failed (${result.status}): ${JSON.stringify(result.body)}`,
      );
    }
    const contacts = result.body.contacts ?? [];
    for (const contact of contacts) {
      if (contact.id) byId.set(contact.id, contact);
    }
    const total = result.body.total ?? byId.size;
    console.log(`Loaded page ${page} (${byId.size}/${total})`);
    if (!contacts.length || byId.size >= total || contacts.length < 100) break;
    await sleep(80);
  }
  return [...byId.values()];
}

function patchPayload(contact) {
  const geo = geoFromTags(contact.tags);
  if (!geo) return null;
  if (timezoneOnly) {
    if (geo.timezone === PACIFIC) return null;
    if (String(contact.timezone ?? "") === geo.timezone) return null;
    return { timezone: geo.timezone };
  }
  const payload = {
    timezone: geo.timezone,
    country: "US",
  };
  if (!String(contact.city ?? "").trim()) payload.city = geo.city;
  if (!String(contact.state ?? "").trim()) payload.state = geo.state;
  return payload;
}

async function searchPacificInMarket(token, locationId, marketSlug, page, pageLimit) {
  return hlFetch(token, locationId, "/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      page,
      pageLimit,
      filters: [
        { field: "tags", operator: "eq", value: marketSlug },
        { field: "timezone", operator: "eq", value: PACIFIC },
      ],
    }),
  });
}

async function loadPacificInMarket(token, locationId, marketSlug) {
  const byId = new Map();
  for (let page = 1; page <= 50; page += 1) {
    const result = await searchPacificInMarket(token, locationId, marketSlug, page, 100);
    if (!result.ok) {
      throw new Error(
        `Search ${marketSlug} failed (${result.status}): ${JSON.stringify(result.body)}`,
      );
    }
    const contacts = result.body.contacts ?? [];
    for (const contact of contacts) {
      if (contact.id) byId.set(contact.id, contact);
    }
    const total = result.body.total ?? byId.size;
    if (!contacts.length || byId.size >= total || contacts.length < 100) break;
    await sleep(80);
  }
  return [...byId.values()];
}

async function patchTimezonesByMarket(token, locationId) {
  const markets = Object.entries(MARKET_GEO).filter(
    ([, geo]) => geo.timezone !== PACIFIC,
  );
  let patched = 0;
  let skipped = 0;
  let errors = 0;
  const perMarket = {};

  for (const [slug, geo] of markets) {
    const contacts = (await loadPacificInMarket(token, locationId, slug)).filter(
      (contact) => {
        const tags = Array.isArray(contact.tags) ? contact.tags : [];
        return tags.includes("shareatrade-list");
      },
    );
    perMarket[slug] = contacts.length;
    console.log(`${slug}: ${contacts.length} still Pacific → ${geo.timezone}`);
    if (dryRun) continue;

    for (const contact of contacts) {
      if (limit && patched >= limit) break;
      const result = await patchContact(token, locationId, contact.id, {
        timezone: geo.timezone,
      });
      if (!result.ok) {
        errors += 1;
        console.error(
          `Error ${contact.companyName}: ${result.status} ${result.message}`,
        );
      } else {
        patched += 1;
      }
      if (patched % 50 === 0) {
        console.log(`Progress patched=${patched} skipped=${skipped} errors=${errors}`);
      }
      await sleep(80);
    }
    if (limit && patched >= limit) break;
  }

  console.log(JSON.stringify({ dryRun, perMarket, patched, skipped, errors }, null, 2));
}

async function loadTaggedMarket(token, locationId, marketSlug) {
  const byId = new Map();
  for (let page = 1; page <= 80; page += 1) {
    const result = await hlFetch(token, locationId, "/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        locationId,
        page,
        pageLimit: 100,
        filters: [{ field: "tags", operator: "eq", value: marketSlug }],
      }),
    });
    if (!result.ok) {
      throw new Error(
        `Search ${marketSlug} failed (${result.status}): ${JSON.stringify(result.body)}`,
      );
    }
    const contacts = result.body.contacts ?? [];
    for (const contact of contacts) {
      if (contact.id) byId.set(contact.id, contact);
    }
    const total = result.body.total ?? byId.size;
    if (!contacts.length || byId.size >= total || contacts.length < 100) break;
    await sleep(80);
  }
  return [...byId.values()];
}

function currentTzTag(tags) {
  const list = Array.isArray(tags) ? tags : [];
  return list.find((tag) => TZ_TAG_NAMES.includes(tag)) ?? null;
}

async function addContactTags(token, locationId, contactId, tags) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { ok, status, body } = await hlFetch(
      token,
      locationId,
      `/contacts/${contactId}/tags`,
      { method: "POST", body: JSON.stringify({ tags }) },
    );
    if (status === 0 || status === 429 || status === 502 || status === 503 || status === 524) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!ok) {
      const message = body?.message ?? body?.error ?? JSON.stringify(body ?? {});
      return { ok: false, status, message: String(message).slice(0, 300) };
    }
    return { ok: true, status };
  }
  return { ok: false, status: 429, message: "Rate limited after retries" };
}

async function patchTzTagsByMarket(token, locationId) {
  let added = 0;
  let skipped = 0;
  let errors = 0;
  const perMarket = {};

  for (const [slug, geo] of Object.entries(MARKET_GEO)) {
    const tzTag = tzTagForTimezone(geo.timezone);
    if (!tzTag) continue;
    const contacts = (await loadTaggedMarket(token, locationId, slug)).filter(
      (contact) => {
        const tags = Array.isArray(contact.tags) ? contact.tags : [];
        return tags.includes(LIST_TAG);
      },
    );
    const needs = contacts.filter((contact) => currentTzTag(contact.tags) !== tzTag);
    perMarket[slug] = { total: contacts.length, needsTag: needs.length, tzTag };
    console.log(`${slug}: ${needs.length}/${contacts.length} need ${tzTag}`);
    if (dryRun) continue;

    for (const contact of needs) {
      if (limit && added >= limit) break;
      const existing = currentTzTag(contact.tags);
      if (existing && existing !== tzTag) {
        await hlFetch(token, locationId, `/contacts/${contact.id}/tags`, {
          method: "DELETE",
          body: JSON.stringify({ tags: [existing] }),
        });
      }
      const result = await addContactTags(token, locationId, contact.id, [tzTag]);
      if (!result.ok) {
        errors += 1;
        console.error(
          `Error ${contact.companyName}: ${result.status} ${result.message}`,
        );
      } else {
        added += 1;
      }
      if (added % 50 === 0) {
        console.log(`Progress added=${added} skipped=${skipped} errors=${errors}`);
      }
      await sleep(80);
    }
    if (limit && added >= limit) break;
  }

  console.log(JSON.stringify({ dryRun, perMarket, added, skipped, errors }, null, 2));
}

async function patchContact(token, locationId, contactId, payload) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { ok, status, body } = await hlFetch(
      token,
      locationId,
      `/contacts/${contactId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    if (status === 0 || status === 429 || status === 502 || status === 503 || status === 524) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!ok) {
      const message = body?.message ?? body?.error ?? JSON.stringify(body ?? {});
      return { ok: false, status, message: String(message).slice(0, 300) };
    }
    return { ok: true, status };
  }
  return { ok: false, status: 429, message: "Rate limited after retries" };
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

  if (tzTagsOnly) {
    await patchTzTagsByMarket(token, locationId);
    return;
  }

  if (timezoneOnly) {
    await patchTimezonesByMarket(token, locationId);
    return;
  }

  const contacts = await loadAllMatching(token, locationId);
  const toPatch = contacts.filter((c) => patchPayload(c));
  const sample = toPatch.slice(0, 3).map((c) => ({
    companyName: c.companyName,
    tags: c.tags,
    city: c.city ?? null,
    state: c.state ?? null,
    timezone: c.timezone ?? null,
    patch: patchPayload(c),
  }));
  console.log(
    JSON.stringify(
      {
        dryRun,
        timezoneOnly,
        matched: contacts.length,
        needsPatch: toPatch.length,
        sample,
      },
      null,
      2,
    ),
  );
  if (dryRun) return;

  let patched = 0;
  let skipped = 0;
  let errors = 0;
  const rows = limit ? toPatch.slice(0, limit) : toPatch;
  for (const contact of rows) {
    const payload = patchPayload(contact);
    if (!payload) {
      skipped += 1;
      continue;
    }
    const result = await patchContact(token, locationId, contact.id, payload);
    if (!result.ok) {
      errors += 1;
      console.error(
        `Error ${contact.companyName}: ${result.status} ${result.message}`,
      );
    } else {
      patched += 1;
    }
    if ((patched + skipped + errors) % 50 === 0 || patched + skipped + errors === rows.length) {
      console.log(
        `Progress patched=${patched} skipped=${skipped} errors=${errors}`,
      );
    }
    await sleep(80);
  }
  console.log(JSON.stringify({ patched, skipped, errors, total: rows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
