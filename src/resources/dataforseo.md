**Best fit for your use case: DataForSEO Business Data API → Google My Business Info endpoint.**

This is the right product for weekly refresh of _existing_ listings by CID or place_id. It is **not** a SERP/rank endpoint and does **not** require keyword-based Maps searches.

### 1. Cheapest endpoint for “business info by CID / place_id” (rating + review count)

**Endpoint family**

`/v3/business_data/google/my_business_info/`

- **Task POST** → later **Task GET** (or Live mode for real-time)

- Pass the identifier in the `keyword` field as:

  - `"keyword": "cid:194604053573767737"`

  - or `"keyword": "place_id:ChIJ..."`

You must also supply a location `location_name`, `location_code`, or `location_coordinate`) and language. For Spokane-area businesses a single US / Washington location is usually fine.

This returns a full public GBP/Maps profile snapshot. Rating + review count are included; full review _text_ is **not** (that is a separate, more expensive Reviews endpoint).

### 2. Pricing (USD, as of latest published rates)

| Mode | Price per successful profile | Per 1,000 profiles |

|------|------------------------------|--------------------|

| **Standard queue** (POST + GET) | **$0.0015** | **$1.50** |

| **Priority queue** | $0.003 | $3.00 |

| **Live mode** (single request) | $0.0054 | $5.40 |

You are billed **only when the task is set**. Getting the result later is free (results kept ~30 days).

**Monthly cost at weekly cadence (52 runs/year ≈ 4.33 runs/month)** assuming 100 % success rate and Standard queue:

| Listings (N) | Cost per weekly run | Approx. monthly cost | Approx. yearly cost |

|--------------|---------------------|----------------------|---------------------|

| 500 | $0.75 | **~$3.25** | **~$39** |

| 1,000 | $1.50 | **~$6.50** | **~$78** |

| 2,000 | $3.00 | **~$13.00** | **~$156** |

(Exact monthly = N × $0.0015 × 52 / 12.)

No volume discounts are published for this endpoint at these volumes; it is pure pay-as-you-go. Minimum top-up after the free $1 credit is $50.

**Extra charges to turn off / avoid**

- Priority `priority: 2`) → doubles the price.

- Live mode → 3.6× the Standard price.

- Depth / SERP-related parameters → not applicable here (this is not a SERP endpoint).

- Location parameters are required but do **not** add extra cost.

- Full review text / Google Reviews endpoint is separate and billed per 10 reviews — do **not** call it.

### 3. Live vs queue / latency

| Mode | Latency (typical) | Notes |

|------|-------------------|-------|

| Standard queue | Average ~5 min, guaranteed up to 45 min | Cheapest. Use postback/pingback or poll `tasks_ready`. |

| Priority queue | Up to ~1 min | 2× price. |

| Live | Average ~6 s | 3.6× price. Single request, no queue. |

For a weekly batch job, **Standard queue is the clear winner**. You can POST up to 100 tasks per request and up to 2,000 API calls per minute.

### 4. Does it return rating + review count without pulling reviews?

**Yes.**

The response includes:

- `rating.value` (e.g. 4.7)

- `rating.votes_count` (total review count)

- `rating_distribution` (1–5 star counts)

- Plus identity fields: `cid`, `place_id`, `feature_id`, `check_url` (fresh Maps/GBP URL)

Full individual review text is **not** returned by this endpoint. That lives in the separate Google Reviews endpoints (billed per 10 reviews).

### 5. Rate limits, batching, closed / unmatched CIDs

- **Rate limits**: 2,000 API calls per minute; max 100 tasks per POST. Higher limits available on request.

- **Batching**: Send up to 100 listings per POST call. Tag each task with your internal ID for easy matching.

- **Closed / unmatched / invalid CID**:

  - Task is still charged.

  - Result will typically have `items_count: 0` or an empty/error status for that task.

  - You should treat empty results as “closed / no longer on Maps / bad ID” and skip or flag the listing.

- Non-Google IDs (your internal prefixes) are simply never sent; they cost nothing.

### 6. Sandbox / test

- **Free Sandbox** (sample/dummy data, same response shape):

  `https://sandbox.dataforseo.com/v3/business_data/google/my_business_info/...`

  Zero cost, unlimited for integration testing.

- **Real-data testing**: New accounts get a **$1 free credit** (no card required). At $0.0015 that is ~666 real lookups — more than enough for a 10–20 listing proof-of-concept.

- Also available: API Playground inside the dashboard (real calls, uses your balance).

### Nice-to-haves you get “for free” (bundled in the same $0.0015)

In the same response you already receive:

- Phone

- Website / domain

- Claimed status `is_claimed`)

- Primary + additional categories

- Fresh Maps URL `check_url`)

- Address components, coordinates, logo, total photos, attributes, work hours, etc.

You can ignore the extra fields you don’t need; there is no way to request a cheaper “rating-only” subset.

### Recommended production pattern

1. Weekly cron: filter out non-Google CIDs.

2. POST batches of ≤100 tasks with `keyword: "cid:..."`, a fixed Spokane/WA location, English, Standard priority, and your internal ID as `tag`.

3. Use pingback/postback or poll `tasks_ready` + Task GET.

4. Match on returned `cid` / `place_id` / `tag`, update rating + votes_count (and any other fields you want).

5. Log zero-result tasks as closed/unmatched.

This is one of the cheapest reliable ways to keep existing Google ratings and review counts fresh at weekly cadence. For 500–2,000 listings the monthly cost is essentially pocket change.
