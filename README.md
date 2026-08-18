# Spokane Contractors

Astro + Convex directory of Spokane-area contractors for homeowners and local trades.

## Setup

```bash
npm install
npx convex dev
```

Copy `CONVEX_URL` into `PUBLIC_CONVEX_URL` in `.env.local` (already done if you used `npx convex deployment create --select`).

## Import listings

```bash
npm run import:contractors:dry   # preview kept/dropped categories
npm run import:contractors       # upsert into Convex
```

Import keeps contractor-like categories only (WA/ID + blank state) and skips scraped page-text fields.

## Enrich WA licenses

Pulls public Washington L&I registration numbers via [data.wa.gov](https://data.wa.gov/Labor/L-I-Contractor-License-Data-General/m8qx-ubtq) and attaches high-confidence matches:

```bash
npm run enrich:licenses:dry
npm run enrich:licenses
```

License numbers appear on contractor detail pages with a link to verify on L&I.

## Refresh Google ratings (DataForSEO)

Monthly (or weekly) refresh of rating and review count by Google CID. Crons in `convex/crons.ts` stay commented until the directory has traffic.

Set Convex env (not `.env.local`):

```bash
npx convex env set DATAFORSEO_LOGIN "your-login"
npx convex env set DATAFORSEO_PASSWORD "your-password"
# optional: npx convex env set DATAFORSEO_SANDBOX 1
# optional: npx convex env set DATAFORSEO_LOCATION "Spokane,Washington,United States"
```

```bash
npm run gbp:refresh:post:dry          # who would be sent (skips nicc: ids)
npm run gbp:refresh:post -- --limit=10
# wait until tasks finish (often ~5 min, up to 45)
npm run gbp:refresh:collect
```

Uncomment the monthly (or weekly) pair in `convex/crons.ts` when you want it on. Collect should run about an hour after post. Standard queue only — no review-text endpoint, no Maps rank recrawl.

## Develop

```bash
npx convex dev   # terminal 1
npm run dev      # terminal 2
```

- `/` — filterable directory
- `/[slug]` — company detail (`/contractors/[slug]` redirects here)
