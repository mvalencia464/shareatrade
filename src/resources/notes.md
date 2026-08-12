# LocalProspects — Search & Enrich Local Business Leads

Search for local businesses by niche and city, then enrich them with owner names, business emails, phone numbers with line type, social profiles, and website intelligence.

## API Key

Ask the user for their LocalProspects API key before making any requests. The key starts with lp_. Get one at [https://localprospects.ai/dashboard](https://localprospects.ai/dashboard)

## How It Works

1. Locations — GET /api/v1/locations?q=city+name to find the location_code

2. Search — POST /api/v1/search with keyword, location_code, and optional depth (100, 300, 500, or 700; default 300)

3. Poll — GET /api/v1/job/:id every 5 seconds until status === "completed"

4. Results — GET /api/v1/job/:id/results to fetch enriched businesses

5. Export — Compile all results into a CSV with every field and save locally

## Step 1: Look Up Location Code

```bash

curl -s "[https://localprospects.ai/api/v1/locations?q=<city>](https://localprospects.ai/api/v1/locations?q=<city>)" \

  -H "x-api-key: <API_KEY>"

```

Returns { locations: [{ location_code, name, full_name }] }. Pick the best match.

## Step 2: Search

```bash

curl -s -X POST [https://localprospects.ai/api/v1/search](https://localprospects.ai/api/v1/search) \

  -H "Content-Type: application/json" \

  -H "x-api-key: <API_KEY>" \

  -d '{"keyword": "<keyword>", "location_code": <location_code>, "depth": 300}'

```

Returns a job_id. Enrichment runs in the background (30-90 seconds).

## Step 3: Poll for Enrichment

Poll every 5 seconds:

```bash

curl -s [https://localprospects.ai/api/v1/job/<job_id>](https://localprospects.ai/api/v1/job/<job_id>) \

  -H "x-api-key: <API_KEY>"

```

When status === "completed", fetch results.

## Step 4: Fetch Results

```bash

curl -s [https://localprospects.ai/api/v1/job/<job_id>/results](https://localprospects.ai/api/v1/job/<job_id>/results) \

  -H "x-api-key: <API_KEY>"

```

## Step 5: Export to CSV

Ask the user before exporting. Flatten the enriched results into a CSV using this exact header order:

```csv

Google Maps Rank,Name,Category,Website,Owner,Email,Phone,Phone Type,Address,City,State,Rating,Reviews,Review Snippet,Claimed,Socials,Logo URL,Main Image URL,Email 1,Email 2,Email 3,Email 4,Email 5,Phone 1,Phone 1 Type,Phone 1 Carrier,Phone 2,Phone 2 Type,Phone 2 Carrier,Phone 3,Phone 3 Type,Phone 3 Carrier,Phone 4,Phone 4 Type,Phone 4 Carrier,Phone 5,Phone 5 Type,Phone 5 Carrier,Page 1 URL,Page 1 Title,Page 1 Meta,Page 1 Text,Page 2 URL,Page 2 Title,Page 2 Meta,Page 2 Text,Page 3 URL,Page 3 Title,Page 3 Meta,Page 3 Text,Page 4 URL,Page 4 Title,Page 4 Meta,Page 4 Text,Page 5 URL,Page 5 Title,Page 5 Meta,Page 5 Text

```

Use the best-match primary fields for Owner, Email, Phone, and Phone Type. Put all discovered emails and phones into the numbered columns, with line type and carrier for phones. Put crawled website pages into Page 1-5 URL, Title, Meta, and Text columns.

Save the CSV to the user's machine, ready to import into any CRM (GHL, Instantly, HubSpot, etc.).

## Notes

- 1 lead credit per business enriched. Failed enrichments refunded automatically. Polling is free.

- Enrichment takes 30-90 seconds depending on how many businesses have websites.
