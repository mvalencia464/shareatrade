my question:

we have some questions about our other project. Would you rather we grant you access to the convex project, or would you prefer to answer the questions or both? here are the questions:

[I put your questions that you asked in chat]

---

answer:  
**Both — but a sample pack first.** Convex access is only useful if that other app is actually a Convex deployment. This workspace `LocalProspects`) is not: it is a CLI over `localprospects.ai` plus HighLevel. Granting Convex here would not answer those importer questions.

What I would send them, based on this repo (honest gaps marked).

### Preference

1. **8–15 real flattened rows** (what we already push to GHL) — this unblocks `normalizeBusiness`.
2. **A one-page field note** (below).
3. **Convex** only if there is a separate Convex leads DB you want me to query live. Point the Convex MCP `projectDir` at that repo.

### 2. Identity

- **Stable ID we actually use:** numeric Google Maps **CID** from `gbpUrl` `https://www.google.com/maps?cid=2208712156619574491`). Not Place ID, not `lp:…` / `nicc:…` in this flatten path.
- **Secondary:** GHL contact id after push; campaign UUID for the _job_, not the business.
- **One company, many locations:** one **listing per CID**. Same brand in two cities = two rows, two CIDs. Match shareatrade on `googleCid` (extract from GBP URL). Do **not** treat name as unique.
- Thin rows can still have CID with **empty city/website** (see Cassidy Plumbing in the last GHL push).

### 3. Geography

- Campaigns are scoped by **numeric** `location_code` (DataForSEO-style), not by metro slug.
- Flattened leads only have `city` _+_ `state` _strings_*. State is often full name `Idaho`), not `ID`. City can be missing.
- **No metro / DMA / alias table** in this project. Raleigh vs Spokane is “run a campaign with that region’s location codes,” then tag the export with a **marketSlug we choose** `boise`, `spokane`, `raleigh`). Shareatrade should not infer metro from city aliases unless we add a mapping file.

### 4. Public listing vs keep in leads

**Put on the directory:** name, category/niche, city, state, phone, website, gbpUrl/CID, rating, reviewCount, claimed, logo, main image, socials.

**Keep in LocalProspects / GHL only:** owner, email waterfall, phone type/carrier, crawled page text, review snippets, CRM tags/pipeline, scores/cost.

### 5. Freshness / source of truth

- Rows are **search + enrich from LocalProspects**, then optional GHL upsert. There is **no** `lastEnrichedAt` **on the flattened CSV**.
- **GBP wins** for name/phone/rating/claimed/CID; website is extra. No manual-override layer in this CLI.
- Re-import: we can emit directory-only JSON. Shareatrade should **upsert on CID and never overwrite license/claimed-by-us fields**.

### 6. Access / volume / PII

- **Not shared Convex.** Export = campaign JSON/CSV from this CLI, or LocalProspects API `/api/v1`).
- Volume: **thousands per metro/niche**, not a national dump in one table.
- **PII:** emails and extra phones should not go public; primary business phone/website/GBP is directory-safe.

### Samples (structure they asked for)

From a real GHL push (phones not redacted here because they are business GBP numbers):

| Kind | Example |

|---|---|

| Complete contractor | Beacon Plumbing — Meridian, ID, site, `cid=2208712156619574491`, rating 5, 359 reviews, claimed Yes |

| Thin | Cassidy Plumbing — CID + rating/reviews, **empty** city/state/website/address |

| Outside Spokane | Boise / Meridian / Idaho campaigns (national-capable) |

| Same name, different city | Need a targeted query; not in the snippet I opened |

| Same CID collision | Should not happen if CID is the key |

| Realtor/dentist | Not in plumber campaign cache; we would pull from a different keyword campaign |

`flatten.ts` already guesses aliases `gbp_urlgbpUrl`, `review_countreviewCount`, nested `businessplace`). Giving them **flattened export + CID** is better than raw LP payloads.

If you want, next I can pull 12 redacted JSON rows from cache covering complete / thin / two cities / non-trade, and you paste that into the shareatrade chat. Convex still optional unless that other app is the real store.
