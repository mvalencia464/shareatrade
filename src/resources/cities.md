# **Shareatrade markets to add**

One URL per metro `/boise`), not per suburb. Towns become the city dropdown inside that market. Ranked from LocalProspects export CSVs (waves 1–12, five trades, ~30k rows with a city) plus Balint geo notes. Counts are row volume, not unique CIDs.

**1**

Live market (Spokane)

**893**

Distinct city+state in LP CSVs

**~30k**

Rows with a city (not 40k URLs)

**3**

P1 slugs to add next

**Do not add 893 city pages**

Those 893 names are listing cities. Adding them as MARKETS would create empty or overlapping directories. Stamp one marketSlug per campaign metro, then import with --market that slug.

**Spokane is not in the LP rings**

Wave CSVs are national rings (Everett, Meridian, Charlotte…). Inland Northwest listings on the site still come from spokane_directory CSV / NICC until you run a Spokane LocalProspects campaign.

## **Priority queue (add these slugs)**

| **P** | **Slug**          | **Market**           | **Status**   | **LP rows** | **Towns inside (city filter, not new URLs)**                                             | **Why**                                                                                               |
| ----- | ----------------- | -------------------- | ------------ | ----------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| P0    | spokane           | Spokane, WA          | Live         | CSV ~986    | Valley, Liberty Lake, Cheney, Airway Heights, Deer Park, Coeur d'Alene / Post Falls (ID) | Already on MARKETS. LP rings have almost no Spokane — keep CSV/NICC until a Spokane campaign.         |
| P1    | boise             | Boise, ID            | Next         | 423+        | Meridian, Eagle, Nampa, Garden City, Kuna, Star                                          | Ring12 already pulled Treasure Valley. Same size/shape as Spokane. Do not stamp as spokane.           |
| P1    | raleigh           | Raleigh–Durham, NC   | Next         | 965+        | Cary, Apex, Fuquay-Varina, Garner, Wake Forest, Holly Springs, Durham                    | Named in the URL plan. Wave 4 is heavy Raleigh. One slug; towns are city filters.                     |
| P1    | portland          | Portland, OR         | Next         | 757+        | Beaverton, Hillsboro, Tigard, Lake Oswego, Gresham, Vancouver WA                         | PNW cluster with Spokane. Wave 5 + 12. Vancouver WA stays portland, not seattle.                      |
| P2    | indianapolis      | Indianapolis, IN     | Soon         | 1836+       | Carmel, Fishers, Noblesville, Greenwood, Westfield, Zionsville                           | Highest IN volume is the ring (Carmel/Fishers), which matches Balint.                                 |
| P2    | kansas-city       | Kansas City, KS/MO   | Soon         | 1571+       | Overland Park, Lenexa, Olathe, Lee's Summit, Shawnee                                     | Johnson County ring, not downtown KC. Waves 3, 7, 8.                                                  |
| P2    | nashville         | Nashville, TN        | Soon         | 1436+       | Franklin, Murfreesboro, Brentwood, Hendersonville, Gallatin, Smyrna                      | Ring towns beat Nashville core. Waves 1 and 5.                                                        |
| P2    | charlotte         | Charlotte, NC        | Soon         | 1522+       | Concord, Mooresville, Cornelius, Matthews, Huntersville, Rock Hill SC                    | Wave 2 bulk. Rock Hill is the SC ring, still charlotte market.                                        |
| P2    | salt-lake         | Salt Lake Valley, UT | Soon         | 902+        | Sandy, South Jordan, West Jordan, Draper, Lehi, Midvale                                  | Wave 11. Provo/Orem can wait as a later slug if volume grows.                                         |
| P2    | columbus          | Columbus, OH         | Soon         | 571+        | Westerville, Dublin, Hilliard, Worthington, Mason / Loveland (Cincy bleed)               | Wave 7. Filter dentist/realtor junk on import.                                                        |
| P3    | denver            | Denver suburbs, CO   | Later        | 2474+       | Littleton, Castle Rock, Parker, Arvada, Centennial, Englewood, Westminster               | Biggest LP pile. Position as the ring, not downtown Denver (Balint).                                  |
| P3    | phoenix           | East Valley, AZ      | Later        | 1934+       | Gilbert, Chandler, Mesa, Peoria, Surprise, Queen Creek                                   | Avoid selling 'Phoenix' as the product; the data is suburb-heavy.                                     |
| P3    | atlanta           | North Atlanta, GA    | Later        | 1701+       | Marietta, Alpharetta, Roswell, Woodstock, Kennesaw, Lawrenceville                        | Waves 1 and 5. Ring towns, not in-town Atlanta.                                                       |
| P3    | northern-virginia | Northern Virginia    | Later        | 1388+       | Sterling, Ashburn, Leesburg, Fairfax, Manassas, Woodbridge, Reston                       | High-income residential (Balint ads note). Waves 2 and 6.                                             |
| P3    | minneapolis       | Minneapolis ring, MN | Later        | 732+        | Plymouth, Maple Grove, Eden Prairie, Woodbury, Bloomington                               | Solid volume; less PNW affinity than P1.                                                              |
| P4    | seattle           | Puget Sound ring, WA | Defer core   | 555+        | Everett, Puyallup, Snohomish, Lake Stevens, Marysville, Kirkland                         | LP is Everett/Puyallup, not Seattle proper (44 rows). Huge market; easy to pollute with 'Spokane St'. |
| P4    | milwaukee         | Milwaukee, WI        | Queue        | 503+        | Waukesha, Brookfield, New Berlin, West Allis, Wauwatosa                                  | Wave data present; mid-size ring fit.                                                                 |
| P4    | huntsville        | Huntsville, AL       | Queue        | 399+        | Madison AL, nearby                                                                       | Wave 10. Mid-size, not tiny. Good Balint shape.                                                       |
| P4    | richmond          | Richmond, VA         | Queue        | 342+        | Midlothian, Mechanicsville, Glen Allen, Henrico                                          | Wave 10.                                                                                              |
| P4    | charleston        | Charleston, SC       | Queue        | 289+        | Mt Pleasant, North Charleston, Summerville                                               | Wave 10.                                                                                              |
| P4    | omaha             | Omaha, NE            | Queue        | 306+        | Omaha + metro                                                                            | Wave 9.                                                                                               |
| P4    | oklahoma-city     | Oklahoma City, OK    | Queue        | 409+        | Edmond, OKC                                                                              | Wave 9. Edmond is the ring.                                                                           |
| P4    | birmingham        | Birmingham, AL       | Queue        | 275+        | Hoover + suburbs                                                                         | Wave 9.                                                                                               |
| P4    | greenville        | Greenville, SC       | Queue        | 126+        | Simpsonville and nearby                                                                  | Thin vs Charlotte. Realtor sneak-ins showed up here.                                                  |
| P4    | des-moines        | Des Moines, IA       | Queue        | ~240        | Des Moines, Ankeny                                                                       | Unmapped cluster in CSVs. Add if you want Midwest coverage.                                           |
| P5    | chicago           | Chicago suburbs, IL  | Skip for now | 337+        | Naperville, Schaumburg, Hoffman Estates                                                  | Too big / downtown gravity. Thin vs Denver.                                                           |
| P5    | —                 | Texas metros         | Skip default | 18          | Almost none in LP waves                                                                  | Balint: great phone buyers, bad SMS. You barely pulled TX anyway.                                     |
| P5    | —                 | California           | Skip         | 0           | None in these waves                                                                      | He called CA the worst state for this motion.                                                         |

Source: LocalProspects exports/*.csv waves 1–12 · clustered by city/state · Balint: prefer ring towns around a real metro, skip CA and tiny isolated markets

---

## **What to do in order**

This week

Keep `/spokane` on the existing CSV. Add Liberty Lake / Valley only as listing cities, not new slugs.

Add `boise` to both `src/lib/markets.ts` and `convex/lib/markets.ts`, export Ring12 (or a Boise-only campaign) with `--market boise`, import with `--market boise`.

Then

`raleigh` (wave 4) and `portland` (waves 5/12) so the homepage has three real metros besides Spokane.

After that, pick one Midwest ring: Indianapolis or Kansas City — highest LP volume and suburb-shaped.

### **Spokane towns (already the product)**

Spokane, Spokane Valley, Liberty Lake, Airway Heights, Cheney, Medical Lake, Deer Park, Millwood, Mead, Otis Orchards, Greenacres, Veradale, Nine Mile Falls, Colbert, Chattaroy, plus Coeur d'Alene and Post Falls (ID). These belong on `/spokane` as city filters — already in `cityAliases`. They are not new homepage markets.

Unmapped leftover cities in LP (e.g. Peachtree City, Waxhaw, Buckeye) fold into the parent metro when you add that slug — they should not become their own [shareatrade.com](http://shareatrade.com) paths.
