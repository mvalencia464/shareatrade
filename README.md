# Share a Trade

Astro + Convex directory of local contractors. Neighbors find a trade and paste a complete listing into a group chat.

This repo is independent of [Spokane List](https://spokanelist.com). Do not point this app at the Spokane List Convex deployment, and do not push this work to a `spokane-list` remote.

## Markets

One URL per metro (`/nashville`), not per suburb. Towns are city filters inside that market. Registry: `src/lib/markets.ts` (site) and `convex/lib/markets.ts` (GBP location / WA license). Queue notes: `src/resources/cities.md`.

**Live:** Spokane (CSV), then LP-stamped Boise, Raleigh, Portland, Indianapolis, Kansas City, Nashville, Charlotte, Salt Lake, Columbus, Denver, Phoenix, Atlanta, Northern Virginia, Minneapolis, Milwaukee, Huntsville, Richmond, Charleston, Omaha, Oklahoma City, Birmingham, Greenville, Des Moines, Seattle, Chicago, Cincinnati, Tulsa, Detroit.

**Do not add:** 893 city URLs; Texas or California slugs; folding Cincinnati into Columbus; folding Tulsa into Oklahoma City; WA L&I on non-Spokane markets.

City+state aliases matter. Bellevue WA is Seattle; Bellevue NE is Omaha. Plymouth MN is Minneapolis; Plymouth MI is Detroit. Loveland OH is Cincinnati; do not treat Colorado Loveland as Cincy.

Spokane stays on CSV / NICC until a real Spokane LocalProspects campaign exists. LP rings are national suburbs, not Inland Northwest.

## Setup

```bash
npm install
npx convex dev
```

That command must use **this** Convex project (`clean-clownfish-658` in current `.env.local`). Copy `CONVEX_URL` into `PUBLIC_CONVEX_URL`. Never `npx convex deploy` against Spokane List.

`astro build` (including Cloudflare) inlines `PUBLIC_CONVEX_URL`. Production falls back to the default in `astro.config.mjs` unless the Cloudflare project sets the same variable. If the live site talks to a **different** Convex deployment than the one you import into, directories will be empty even when the Worker deploy succeeds.

## URLs

- `/` — pick a market (`live: true` only)
- `/{market}` — directory
- `/{market}/{slug}` — listing
- `/go/{market}/{slug}` — unlisted company preview (noindex). Open it from a listing by clicking the invisible slot just left of the icon toolbar.

## Cloudflare vs local

Market hubs are prerendered HTML under `dist/client/{market}/`. Listings and `/go` pages are **SSR** (`prerender = false`). Homepage and marketing pages stay static.

Workers Builds must upload **both** the Astro server bundle and `dist/client`. If `wrangler.jsonc` has no `main` and no `assets.directory`, Cloudflare deploys an empty Worker: `/` may stay cached while `/boise` and `/why/` 404.

- Production: `@astrojs/cloudflare`, `output: 'server'`. Build command `npm run build`. Deploy command `npx wrangler deploy` (uses `wrangler.jsonc`) or `npm run deploy` (uses `dist/server/wrangler.json`).
- Do not point a Pages project at `dist/client` without a Worker — listing URLs will 404.
- Sessions/KV are off (`session: false`). The adapter otherwise injects a `SESSION` KV binding we do not use.
- Local: `npm run dev` uses `@astrojs/node`. Workerd + Vite SSR crashed; do not switch local back to the Cloudflare adapter. After wiping Vite cache: `rm -rf node_modules/.vite`.
- Prefer `astro dev --background` if you start the server from an agent. Stop with `astro dev stop`.

**Directory lists that hang on “Loading contractors…”** — Cloudflare can succeed while `contractors.listByMarket` `.collect()`s a whole metro and hits Convex’s 16MB read limit (Atlanta / Charlotte / Nashville size). Check the browser console. Smaller metros may still load. Fix is paginate or slim that query, not another CF setting.

## Import listings

Do **not** upsert `src/resources/directory-samples.json` (mixed metros). `--market` is required and must match the stamped JSON.

Spokane CSV:

```bash
npm run import:contractors:dry
npm run import:contractors
```

CSV stamps `marketSlug: "spokane"` and keeps contractor-like categories (WA/ID + blank state).

LocalProspects: GET campaign leads only. **Do not** `POST /search` or start a `ready` campaign (that bills). Cache is `localprospects-search-cache/` (gitignored). Stamp with city+state `RING_PLACES` in `scripts/export-lp-directory.mjs`. Empty GBP city falls back to `searched_location.city` (often `"Marietta, Georgia"`).

```bash
node scripts/export-lp-directory.mjs --from-cache
npm run import:directory -- --file exports/directory-nashville.json --market nashville
```

`exports/directory-*.json` is gitignored. Re-export after alias changes, then import only markets whose counts grew.

## HighLevel

```bash
npm run export:highlevel:dry -- --limit=3
npm run export:highlevel
```

Needs `HIGHLEVEL_TOKEN` and `HIGHLEVEL_LOCATION_ID`. Contacts get tags `shareatrade-list` plus the metro slug (`nashville`), **not** `spokane-list`. Custom TEXT fields `shareatrade_url` and `shareatrade_site` must already exist on the location; upserts cannot create fields. Create them in the HL UI (or API with `locations/customFields.write`). CRM reads go per market (`listForCrmByMarket`) because a full-table collect exceeds Convex limits. Rows with no phone and no email are skipped. Full sync is ~25k upserts at ~200ms each.

## Enrich WA licenses

Spokane only (Washington L&I):

```bash
npm run enrich:licenses:dry
npm run enrich:licenses
```

## Refresh Google ratings (DataForSEO)

Uses each market’s DataForSEO location. Set Convex env on **this** project only:

```bash
npx convex env set DATAFORSEO_LOGIN "your-login"
npx convex env set DATAFORSEO_PASSWORD "your-password"
```

```bash
npm run gbp:refresh:post:dry
npm run gbp:refresh:post -- --limit=10
npm run gbp:refresh:collect
```

## Develop

```bash
npx convex dev   # terminal 1
npm run dev      # terminal 2
```
