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

## Develop

```bash
npx convex dev   # terminal 1
npm run dev      # terminal 2
```

- `/` — filterable directory
- `/[slug]` — company detail (`/contractors/[slug]` redirects here)
