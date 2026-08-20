# Share a Trade

Astro + Convex directory of local contractors. Neighbors find a trade and paste a complete listing into a group chat. Spokane is the first market.

This repo is independent of [Spokane List](https://spokanelist.com). Do not point this app at the Spokane List Convex deployment.

## Setup

```bash
npm install
npx convex dev
```

That command must create a **new** Convex project. Copy `CONVEX_URL` into `PUBLIC_CONVEX_URL` in `.env.local`.

`astro build` (including Cloudflare) inlines `PUBLIC_CONVEX_URL`. Local files stay gitignored, so production uses the default in `astro.config.mjs` unless the project sets the same variable.

Listing and `/go` pages render on demand (Cloudflare Worker) so the build no longer prerenders thousands of HTML files. Keep the homepage and market hubs static. Cloudflare should deploy with Wrangler / Workers (`npx wrangler deploy` after `npm run build`), not as a static `dist` upload. The adapter may provision a `SESSION` KV namespace; we do not use sessions in app code.

## URLs

- `/` — pick a market
- `/spokane` — directory for that market
- `/spokane/[slug]` — listing
- `/go/spokane/[slug]` — unlisted company preview (noindex)

## Import listings

Spokane live data is the existing CSV (and NICC) import until a real Spokane LocalProspects campaign exists. Do **not** upsert `src/resources/directory-samples.json` — those rows are Boise/national fixtures for the mapper.

```bash
npm run import:contractors:dry
npm run import:contractors
```

CSV import stamps `marketSlug: "spokane"` and keeps contractor-like categories only (WA/ID + blank state).

When they have a Spokane campaign, they export then we import **only** that file:

```bash
# other repo
npx tsx src/cli.ts export-directory <campaignId> --market spokane
# writes exports/directory-spokane.json

# this repo
npm run import:directory:dry -- --file exports/directory-spokane.json --market spokane
npm run import:directory -- --file exports/directory-spokane.json --market spokane
```

`--market` is required and must be `spokane`, `boise`, `raleigh`, or `portland`. It skips any row not stamped with that slug. Dry-run the sample pack only to test the mapper (never upsert it):

```bash
npm run import:directory:dry -- --file src/resources/directory-samples.json --market boise
```

P1 markets (`boise`, `raleigh`, `portland`) are in `MARKETS` but `live: false` until a real `exports/directory-{slug}.json` is imported. Homepage only lists `live` markets. Flip `live: true` after a successful import. Do not add P2+ slugs yet.

```bash
npm run import:directory -- --file exports/directory-boise.json --market boise
```

## Enrich WA licenses

Spokane market only (Washington L&I):

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

Never run `npx convex deploy` against the Spokane List project from this repo.
