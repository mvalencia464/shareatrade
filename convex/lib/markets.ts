export const MARKETS = {
  spokane: {
    slug: "spokane",
    name: "Spokane",
    dataforseoLocation: "Spokane,Washington,United States",
    licenseEnrichment: "wa" as const,
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
