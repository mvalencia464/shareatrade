export const MARKETS = [
  {
    slug: "spokane",
    name: "Spokane",
    state: "WA",
    tagline: "Valley, Liberty Lake, Cheney, and nearby towns",
    dataforseoLocation: "Spokane,Washington,United States",
    licenseEnrichment: "wa" as const,
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
    ],
  },
] as const;

export type Market = (typeof MARKETS)[number];
export type MarketSlug = Market["slug"];

export const DEFAULT_MARKET_SLUG: MarketSlug = "spokane";

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
