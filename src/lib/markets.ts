export const MARKETS = [
  {
    slug: "spokane",
    name: "Spokane",
    state: "WA",
    tagline: "Valley, Liberty Lake, Cheney, and nearby towns",
    dataforseoLocation: "Spokane,Washington,United States",
    licenseEnrichment: "wa" as const,
    live: true,
    cityAliases: [
      "Spokane",
      "Spokane Valley",
      "Liberty Lake",
      "Airway Heights",
      "Cheney",
      "Medical Lake",
      "Deer Park",
      "Millwood",
      "Mead",
      "Otis Orchards",
      "Greenacres",
      "Veradale",
      "Nine Mile Falls",
      "Colbert",
      "Chattaroy",
      "Fairchild AFB",
      "Spangle",
      "Marshall",
      "Town and Country",
      "Country Homes",
      "South Hill",
      "Coeur d'Alene",
      "Post Falls",
    ],
  },
  {
    slug: "boise",
    name: "Boise",
    state: "ID",
    tagline: "Meridian, Eagle, Nampa, and the Treasure Valley",
    dataforseoLocation: "Boise,Idaho,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Boise",
      "Meridian",
      "Eagle",
      "Nampa",
      "Garden City",
      "Kuna",
      "Star",
    ],
  },
  {
    slug: "raleigh",
    name: "Raleigh",
    state: "NC",
    tagline: "Cary, Durham, Apex, and Wake County towns",
    dataforseoLocation: "Raleigh,North Carolina,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Raleigh",
      "Cary",
      "Apex",
      "Fuquay-Varina",
      "Garner",
      "Wake Forest",
      "Holly Springs",
      "Durham",
    ],
  },
  {
    slug: "portland",
    name: "Portland",
    state: "OR",
    tagline: "Beaverton, Hillsboro, Gresham, and Vancouver WA",
    dataforseoLocation: "Portland,Oregon,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Portland",
      "Beaverton",
      "Hillsboro",
      "Tigard",
      "Lake Oswego",
      "Gresham",
      "Vancouver",
    ],
  },
  {
    slug: "indianapolis",
    name: "Indianapolis",
    state: "IN",
    tagline: "Carmel, Fishers, Noblesville, and nearby towns",
    dataforseoLocation: "Indianapolis,Indiana,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Indianapolis",
      "Carmel",
      "Fishers",
      "Noblesville",
      "Greenwood",
      "Westfield",
      "Zionsville",
    ],
  },
  {
    slug: "kansas-city",
    name: "Kansas City",
    state: "KS/MO",
    tagline: "Overland Park, Olathe, Lenexa, and Johnson County",
    dataforseoLocation: "Kansas City,Missouri,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Kansas City",
      "Overland Park",
      "Lenexa",
      "Olathe",
      "Lee's Summit",
      "Shawnee",
    ],
  },
  {
    slug: "nashville",
    name: "Nashville",
    state: "TN",
    tagline: "Franklin, Murfreesboro, Brentwood, and nearby towns",
    dataforseoLocation: "Nashville,Tennessee,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Nashville",
      "Franklin",
      "Murfreesboro",
      "Brentwood",
      "Hendersonville",
      "Gallatin",
      "Smyrna",
    ],
  },
  {
    slug: "charlotte",
    name: "Charlotte",
    state: "NC",
    tagline: "Concord, Huntersville, Matthews, and Rock Hill",
    dataforseoLocation: "Charlotte,North Carolina,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Charlotte",
      "Concord",
      "Mooresville",
      "Cornelius",
      "Matthews",
      "Huntersville",
      "Rock Hill",
    ],
  },
  {
    slug: "salt-lake",
    name: "Salt Lake Valley",
    state: "UT",
    tagline: "Sandy, South Jordan, Draper, and nearby towns",
    dataforseoLocation: "Salt Lake City,Utah,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Salt Lake City",
      "Sandy",
      "South Jordan",
      "West Jordan",
      "Draper",
      "Lehi",
      "Midvale",
    ],
  },
  {
    slug: "columbus",
    name: "Columbus",
    state: "OH",
    tagline: "Westerville, Dublin, Hilliard, and nearby towns",
    dataforseoLocation: "Columbus,Ohio,United States",
    licenseEnrichment: false as const,
    live: true,
    cityAliases: [
      "Columbus",
      "Westerville",
      "Dublin",
      "Hilliard",
      "Worthington",
    ],
  },
] as const;

export type Market = (typeof MARKETS)[number];
export type MarketSlug = Market["slug"];

export const DEFAULT_MARKET_SLUG: MarketSlug = "spokane";

export const DIRECTORY_MARKET_SLUGS = MARKETS.map((market) => market.slug);

export function isMarketSlug(value: string): value is MarketSlug {
  return MARKETS.some((market) => market.slug === value);
}

export function getMarket(slug: string): Market | undefined {
  return MARKETS.find((market) => market.slug === slug);
}

export function requireMarket(slug: string): Market {
  const market = getMarket(slug);
  if (!market) {
    throw new Error(`Unknown market: ${slug}`);
  }
  return market;
}

export function liveMarkets(): Market[] {
  return MARKETS.filter((market) => market.live);
}

export function marketCoreCities(slug: string): Set<string> {
  const market = getMarket(slug);
  return new Set(
    (market?.cityAliases ?? []).map((city) => city.replace(/\s+/g, " ").trim().toLowerCase()),
  );
}
