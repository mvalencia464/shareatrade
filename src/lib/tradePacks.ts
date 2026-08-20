/** One preview pack per trade family, plus a default. */
export const TRADE_PACKS = [
  { id: "hvac", match: /hvac|air cond|heating|furnace|heat pump|cooling/ },
  { id: "roofing", match: /roof/ },
  { id: "pest", match: /pest|termite|rodent/ },
  { id: "plumbing", match: /plumb/ },
  { id: "electrical", match: /electr/ },
  { id: "garage", match: /garage/ },
  { id: "landscape", match: /landscap|lawn/ },
  { id: "paint", match: /paint/ },
  { id: "tree", match: /tree/ },
  { id: "fence", match: /fence/ },
  { id: "concrete", match: /concrete|mason/ },
  { id: "cleaning", match: /clean|pressure wash|carpet clean|junk/ },
  { id: "gutter", match: /gutter/ },
  { id: "siding", match: /sid(e|ing)|window/ },
  { id: "handyman", match: /handyman|general contractor|remodel|builder/ },
] as const;

export const DEFAULT_TRADE_PACK = { id: "default" } as const;

export const TRADE_PACK_CDN = "https://media.stokeleads.com/spokanelist";
export const CREW_PHOTO_CDN = "https://media.stokeleads.com/shareatrade";

export function tradePackId(niche: string): string {
  const n = niche.toLowerCase();
  const pack = TRADE_PACKS.find((item) => item.match.test(n));
  return pack?.id ?? DEFAULT_TRADE_PACK.id;
}

function tradeFileId(niche: string): string {
  const id = tradePackId(niche);
  return id === DEFAULT_TRADE_PACK.id ? "handyman" : id;
}

export function nicheHeroPhoto(niche: string): string {
  return `${TRADE_PACK_CDN}/${tradeFileId(niche)}.avif`;
}

export function nicheCrewPhoto(niche: string): string {
  return `${CREW_PHOTO_CDN}/${tradeFileId(niche)}-crew.avif`;
}
