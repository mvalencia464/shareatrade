export const MARKETS = {
  spokane: {
    slug: "spokane",
    name: "Spokane",
    dataforseoLocation: "Spokane,Washington,United States",
    licenseEnrichment: "wa" as const,
  },
  boise: {
    slug: "boise",
    name: "Boise",
    dataforseoLocation: "Boise,Idaho,United States",
    licenseEnrichment: false as const,
  },
  raleigh: {
    slug: "raleigh",
    name: "Raleigh",
    dataforseoLocation: "Raleigh,North Carolina,United States",
    licenseEnrichment: false as const,
  },
  portland: {
    slug: "portland",
    name: "Portland",
    dataforseoLocation: "Portland,Oregon,United States",
    licenseEnrichment: false as const,
  },
  indianapolis: {
    slug: "indianapolis",
    name: "Indianapolis",
    dataforseoLocation: "Indianapolis,Indiana,United States",
    licenseEnrichment: false as const,
  },
  "kansas-city": {
    slug: "kansas-city",
    name: "Kansas City",
    dataforseoLocation: "Kansas City,Missouri,United States",
    licenseEnrichment: false as const,
  },
  nashville: {
    slug: "nashville",
    name: "Nashville",
    dataforseoLocation: "Nashville,Tennessee,United States",
    licenseEnrichment: false as const,
  },
  charlotte: {
    slug: "charlotte",
    name: "Charlotte",
    dataforseoLocation: "Charlotte,North Carolina,United States",
    licenseEnrichment: false as const,
  },
  "salt-lake": {
    slug: "salt-lake",
    name: "Salt Lake Valley",
    dataforseoLocation: "Salt Lake City,Utah,United States",
    licenseEnrichment: false as const,
  },
  columbus: {
    slug: "columbus",
    name: "Columbus",
    dataforseoLocation: "Columbus,Ohio,United States",
    licenseEnrichment: false as const,
  },
  denver: {
    slug: "denver",
    name: "Denver",
    dataforseoLocation: "Denver,Colorado,United States",
    licenseEnrichment: false as const,
  },
  phoenix: {
    slug: "phoenix",
    name: "Phoenix",
    dataforseoLocation: "Phoenix,Arizona,United States",
    licenseEnrichment: false as const,
  },
  atlanta: {
    slug: "atlanta",
    name: "Atlanta",
    dataforseoLocation: "Atlanta,Georgia,United States",
    licenseEnrichment: false as const,
  },
  "northern-virginia": {
    slug: "northern-virginia",
    name: "Northern Virginia",
    dataforseoLocation: "Fairfax,Virginia,United States",
    licenseEnrichment: false as const,
  },
  minneapolis: {
    slug: "minneapolis",
    name: "Minneapolis",
    dataforseoLocation: "Minneapolis,Minnesota,United States",
    licenseEnrichment: false as const,
  },
  milwaukee: {
    slug: "milwaukee",
    name: "Milwaukee",
    dataforseoLocation: "Milwaukee,Wisconsin,United States",
    licenseEnrichment: false as const,
  },
  huntsville: {
    slug: "huntsville",
    name: "Huntsville",
    dataforseoLocation: "Huntsville,Alabama,United States",
    licenseEnrichment: false as const,
  },
  richmond: {
    slug: "richmond",
    name: "Richmond",
    dataforseoLocation: "Richmond,Virginia,United States",
    licenseEnrichment: false as const,
  },
  charleston: {
    slug: "charleston",
    name: "Charleston",
    dataforseoLocation: "Charleston,South Carolina,United States",
    licenseEnrichment: false as const,
  },
  omaha: {
    slug: "omaha",
    name: "Omaha",
    dataforseoLocation: "Omaha,Nebraska,United States",
    licenseEnrichment: false as const,
  },
  "oklahoma-city": {
    slug: "oklahoma-city",
    name: "Oklahoma City",
    dataforseoLocation: "Oklahoma City,Oklahoma,United States",
    licenseEnrichment: false as const,
  },
  birmingham: {
    slug: "birmingham",
    name: "Birmingham",
    dataforseoLocation: "Birmingham,Alabama,United States",
    licenseEnrichment: false as const,
  },
  greenville: {
    slug: "greenville",
    name: "Greenville",
    dataforseoLocation: "Greenville,South Carolina,United States",
    licenseEnrichment: false as const,
  },
  "des-moines": {
    slug: "des-moines",
    name: "Des Moines",
    dataforseoLocation: "Des Moines,Iowa,United States",
    licenseEnrichment: false as const,
  },
  seattle: {
    slug: "seattle",
    name: "Seattle",
    dataforseoLocation: "Seattle,Washington,United States",
    licenseEnrichment: false as const,
  },
} as const;

export type MarketSlug = keyof typeof MARKETS;

export const DEFAULT_MARKET_SLUG: MarketSlug = "spokane";
export const WA_LICENSE_MARKET_SLUG: MarketSlug = "spokane";

export function isMarketSlug(value: string): value is MarketSlug {
  return value in MARKETS;
}

export function dataforseoLocationForMarket(marketSlug: string): string {
  if (isMarketSlug(marketSlug)) {
    return MARKETS[marketSlug].dataforseoLocation;
  }
  return (
    process.env.DATAFORSEO_LOCATION?.trim() ||
    MARKETS.spokane.dataforseoLocation
  );
}
