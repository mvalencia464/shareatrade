## **Search Campaigns**

**POST**`/api/v1/campaigns`

Create a resumable multi-location search. Campaigns are available on every plan and use the same lead-credit balance as ordinary searches. Only the next location must fit the current balance; a low balance pauses the campaign and it must be resumed manually after credits are added.

### **Create a campaign**

| **Parameter**         | **Type**  | **Description**                                                                 |
| --------------------- | --------- | ------------------------------------------------------------------------------- |
| keyword               | string    | One business niche for this campaign                                            |
| campaign_id           | UUID      | Optional client-generated idempotency key; safely reuse it when retrying create |
| name                  | string    | Optional display name                                                           |
| max_leads             | integer   | Optional campaign-wide stopping limit                                           |
| scope.include         | integer[] | Ordered country, region, or city location codes                                 |
| scope.exclude         | integer[] | Descendants to omit from an included area                                       |
| scope.default_depth   | integer   | 100, 300, 500, or 700; campaigns default to 100                                 |
| scope.depth_overrides | object    | Optional location-code to depth overrides                                       |

bash

```
curl -X POST https://localprospects.ai/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -H "x-api-key: lp_your_key" \
  -d '{
    "name": "California plumbers",
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

Use `POST /api/v1/campaigns/preview` with the same body to resolve and review the plan without saving it.

### **Lifecycle and results**

| **Field**                                 | **Description**                                             |
| ----------------------------------------- | ----------------------------------------------------------- |
| GET /api/v1/campaigns                     | List campaigns for the API key owner                        |
| GET /api/v1/campaigns/:id                 | Campaign, ordered plan, child searches, stats, and activity |
| PATCH /api/v1/campaigns/:id               | Edit a draft or paused plan; the active location is locked  |
| POST /api/v1/campaigns/:id/actions/start  | Start a ready campaign                                      |
| POST /api/v1/campaigns/:id/actions/pause  | Prevent another location from starting                      |
| POST /api/v1/campaigns/:id/actions/resume | Continue a paused or attention-needed campaign              |
| POST /api/v1/campaigns/:id/actions/stop   | Permanently stop future searches                            |
| GET /api/v1/campaigns/:id/leads           | Paginated, cross-search deduplicated campaign leads         |
| GET /api/v1/campaigns/:id/plan            | Paginate large frozen execution plans                       |
| GET /api/v1/campaigns/:id/export          | Download the deduplicated campaign pool as CSV              |
| POST /api/v1/campaigns/:id/searches       | Attach an existing same-keyword search with { job_id }      |
| GET /api/v1/campaign-locations            | Browse countries, regions, and cities for scope codes       |

Each child is a normal search job with a `campaign_id`. Searches run one at a time, reserve their selected depth, charge only returned leads, and refund the unused reservation. A no-results response completes with zero leads, while a real failed location is recorded in the final campaign totals. The campaign lead view and export merge repeated businesses; V1 billing is still settled independently for each child search.
