# LocalProspects leads playbook

Portable workflow for pulling enriched local-business leads with [LocalProspects](https://localprospects.ai). Copy this file into any project. It is not tied to a city, niche, or CMS.

**Prefer campaigns** when you need more than one city, a region, or a state. That is the main upgrade versus firing one search per city: one plan, sequential child jobs, campaign-level dedupe, and a single export.

## API key

Ask the user for their LocalProspects API key before any request. Keys start with `lp_`. Dashboard: https://localprospects.ai/dashboard

Header on every call:

```
x-api-key: lp_your_key
```

Base URL: `https://localprospects.ai/api/v1`

## Credits (why campaigns help)

- **1 lead credit per business enriched.** Failed enrichments refund. Polling is free.
- Campaigns use the **same credit balance** as ordinary searches.
- Each child search **reserves its selected depth**, **charges only returned leads**, and **refunds the unused reservation**.
- A no-results location completes with **zero leads**. A real failed location is counted in campaign totals.
- **V1 billing is still settled per child search.** Campaign export **merges repeated businesses** in the lead view/CSV, but overlapping cities can still burn credits on the same business if it appears in more than one child search. Prefer a **parent region + excludes** over many overlapping city jobs when coverage allows.
- Only the **next** location must fit the current balance. A low balance **pauses** the campaign; resume manually after adding credits. Do not assume auto-resume.

Depth options: `100`, `300`, `500`, `700`. Campaigns default to **100**. Start at 100 unless the niche is thin.

## When to use which path

| Situation | Use |
| --- | --- |
| One city, one keyword | `POST /search` (single job) |
| Metro, county, state, or several cities; same keyword | **Campaign** |
| Several niches | One campaign **per keyword**. Do not mix niches in one campaign. |
| Retry a create that may have already succeeded | Reuse the same `campaign_id` UUID |

## Path A — Campaigns (preferred for area coverage)

### 1. Resolve scope codes

Browse the location tree (countries, regions, cities):

```bash
curl -s "https://localprospects.ai/api/v1/campaign-locations" \
  -H "x-api-key: lp_your_key"
```

There is also city search for single jobs:

```bash
curl -s "https://localprospects.ai/api/v1/locations?q=Austin+TX" \
  -H "x-api-key: lp_your_key"
```

Pick **integer location codes**. Typical pattern:

- `scope.include`: parent area (state, metro, or city list in the order you want searched).
- `scope.exclude`: descendants you do not want (e.g. a city inside an included region).
- `scope.default_depth`: usually `100`.
- `scope.depth_overrides`: bump a high-value city (e.g. `{ "1014221": 700 }`).

### 2. Preview before you spend

Same body as create. Resolves the plan without saving it. **Always preview** on a new geography.

```bash
curl -s -X POST https://localprospects.ai/api/v1/campaigns/preview \
  -H "Content-Type: application/json" \
  -H "x-api-key: lp_your_key" \
  -d '{
    "name": "Texas plumbers",
    "keyword": "plumber",
    "max_leads": 5000,
    "scope": {
      "include": [21137],
      "exclude": [1014369],
      "default_depth": 100,
      "depth_overrides": { "1014221": 700 }
    }
  }'
```

Check: location count, order, depths, and that excludes actually drop the cities you meant to skip. Adjust `max_leads` to a hard stop if you have a budget.

### 3. Create

Optional `campaign_id` is a client UUID for idempotency. Reuse it if create might have succeeded and the client timed out.

```bash
curl -s -X POST https://localprospects.ai/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -H "x-api-key: lp_your_key" \
  -d '{
    "name": "Texas plumbers",
    "keyword": "plumber",
    "max_leads": 5000,
    "scope": {
      "include": [21137],
      "exclude": [1014369],
      "default_depth": 100,
      "depth_overrides": { "1014221": 700 }
    }
  }'
```

| Parameter | Type | Notes |
| --- | --- | --- |
| `keyword` | string | One niche per campaign |
| `campaign_id` | UUID | Optional idempotency key |
| `name` | string | Optional display name |
| `max_leads` | integer | Optional campaign-wide stop |
| `scope.include` | integer[] | Ordered country / region / city codes |
| `scope.exclude` | integer[] | Descendants to omit from an included area |
| `scope.default_depth` | integer | 100, 300, 500, or 700; default 100 |
| `scope.depth_overrides` | object | Location code → depth |

### 4. Lifecycle

Child jobs are normal searches with a `campaign_id`. They run **one at a time**.

| Call | Purpose |
| --- | --- |
| `GET /api/v1/campaigns` | List campaigns for this key |
| `GET /api/v1/campaigns/:id` | Plan, child searches, stats, activity |
| `PATCH /api/v1/campaigns/:id` | Edit **draft or paused** plan; active location is locked |
| `POST /api/v1/campaigns/:id/actions/start` | Start a ready campaign |
| `POST /api/v1/campaigns/:id/actions/pause` | Do not start the next location |
| `POST /api/v1/campaigns/:id/actions/resume` | Continue paused or attention-needed |
| `POST /api/v1/campaigns/:id/actions/stop` | Permanently stop future searches |
| `GET /api/v1/campaigns/:id/leads` | Paginated, **cross-search deduped** leads |
| `GET /api/v1/campaigns/:id/plan` | Paginate large frozen plans |
| `GET /api/v1/campaigns/:id/export` | Deduplicated pool as CSV |
| `POST /api/v1/campaigns/:id/searches` | Attach an existing **same-keyword** search `{ "job_id": "..." }` |

Start after create:

```bash
curl -s -X POST "https://localprospects.ai/api/v1/campaigns/<CAMPAIGN_ID>/actions/start" \
  -H "x-api-key: lp_your_key"
```

Poll `GET /campaigns/:id` until the campaign is finished, paused, or needs attention. Do not hammer; every 15–30 seconds is enough. If paused for credits, add balance, then `resume`.

### 5. Pull leads

Prefer campaign endpoints over stitching child `/job/:id/results` yourself.

```bash
curl -s "https://localprospects.ai/api/v1/campaigns/<CAMPAIGN_ID>/leads" \
  -H "x-api-key: lp_your_key"
```

CSV (ask before writing a file):

```bash
curl -s "https://localprospects.ai/api/v1/campaigns/<CAMPAIGN_ID>/export" \
  -H "x-api-key: lp_your_key" \
  -o localprospects-campaign.csv
```

## Path B — Single search (one city)

Use this for a smoke test, a tiny market, or attaching a leftover job to a campaign.

1. Look up `location_code`:

```bash
curl -s "https://localprospects.ai/api/v1/locations?q=Austin+TX" \
  -H "x-api-key: lp_your_key"
```

Returns `{ locations: [{ location_code, name, full_name }] }`. Pick the best match.

2. Start search (`depth` optional; API default is often 300 — set it explicitly):

```bash
curl -s -X POST https://localprospects.ai/api/v1/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: lp_your_key" \
  -d '{"keyword": "plumber", "location_code": 12345, "depth": 100}'
```

Returns a `job_id`. Enrichment is typically 30–90 seconds.

3. Poll every 5 seconds until `status === "completed"`:

```bash
curl -s "https://localprospects.ai/api/v1/job/<JOB_ID>" \
  -H "x-api-key: lp_your_key"
```

4. Fetch rows:

```bash
curl -s "https://localprospects.ai/api/v1/job/<JOB_ID>/results" \
  -H "x-api-key: lp_your_key"
```

If you later create a campaign for the same keyword, attach this job with `POST /campaigns/:id/searches` and `{ "job_id": "..." }` instead of paying for that city again.

## CSV shape (manual flatten)

If you flatten JSON yourself (single-job results, or you are not using campaign export), ask before writing a file. Header order:

```csv
Google Maps Rank,Name,Category,Website,Owner,Email,Phone,Phone Type,Address,City,State,Rating,Reviews,Review Snippet,Claimed,Socials,Logo URL,Main Image URL,Email 1,Email 2,Email 3,Email 4,Email 5,Phone 1,Phone 1 Type,Phone 1 Carrier,Phone 2,Phone 2 Type,Phone 2 Carrier,Phone 3,Phone 3 Type,Phone 3 Carrier,Phone 4,Phone 4 Type,Phone 4 Carrier,Phone 5,Phone 5 Type,Phone 5 Carrier,Page 1 URL,Page 1 Title,Page 1 Meta,Page 1 Text,Page 2 URL,Page 2 Title,Page 2 Meta,Page 2 Text,Page 3 URL,Page 3 Title,Page 3 Meta,Page 3 Text,Page 4 URL,Page 4 Title,Page 4 Meta,Page 4 Text,Page 5 URL,Page 5 Title,Page 5 Meta,Page 5 Text
```

Use best-match primaries for Owner, Email, Phone, and Phone Type. Put all emails/phones in numbered columns (phones include line type and carrier). Put crawled pages in Page 1–5 URL, Title, Meta, Text.

Ready for GHL, Instantly, HubSpot, or a custom import.

## Agent checklist

1. Confirm niche keyword(s), geography, depth, and `max_leads` / credit budget.
2. Get `lp_` key; never commit it.
3. If more than one location: preview campaign → create → start → poll campaign → export/leads.
4. If one city: search → poll job → results (or attach to a campaign later).
5. One campaign per keyword.
6. Filter in your app after import (category, state, website present, etc.). Campaigns do not know your vertical rules.
7. Cache raw JSON locally if you will re-import; do not re-run paid searches to rebuild a pipeline.

## What this replaces

The older pattern was: resolve each city code, `POST /search` per city, poll each job, merge JSON, and dedupe by Google CID. That still works. Campaigns are better when the area is larger than one city because the plan, pause/resume, sequential execution, and **exported** dedupe live on the API. Keep overlap in mind: billing is still per child search, so a region-plus-exclude plan is usually cheaper than adjacent cities that share the same businesses.
