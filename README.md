# Share a Trade

Astro + Convex directory of local contractors. Neighbors find a trade and paste a complete listing into a group chat. Spokane is the first market.

This repo is independent of [Spokane List](https://spokanelist.com). Do not point this app at the Spokane List Convex deployment.

## Setup

```bash
npm install
npx convex dev
```

That command must create a **new** Convex project. Copy `CONVEX_URL` into `PUBLIC_CONVEX_URL` in `.env.local`.

## URLs

- `/` — pick a market
- `/spokane` — directory for that market
- `/spokane/[slug]` — listing
- `/go/spokane/[slug]` — unlisted company preview (noindex)

## Import listings

```bash
npm run import:contractors:dry
npm run import:contractors
```

CSV import stamps `marketSlug: "spokane"` and keeps contractor-like categories only (WA/ID + blank state).

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
