/** One preview pack per trade family, plus a default. */
export const TRADE_PACKS = [
  {
    id: "hvac",
    match: /hvac|air cond|heating|furnace|heat pump|cooling/,
    prompt:
      "Photorealistic photo of an HVAC technician in a residential backyard working on an outdoor heat pump, inland northwest suburban house, natural daylight, no text, no logo",
  },
  {
    id: "roofing",
    match: /roof/,
    prompt:
      "Photorealistic photo of roofers installing architectural shingles on a two-story house, snow-ready roof, suburban Pacific Northwest, natural daylight, no text, no logo",
  },
  {
    id: "pest",
    match: /pest|termite|rodent/,
    prompt:
      "Photorealistic photo of a pest control technician in a work uniform inspecting the foundation of a suburban house, spray tank nearby, natural daylight, no text, no logo",
  },
  {
    id: "plumbing",
    match: /plumb/,
    prompt:
      "Photorealistic photo of a plumber under a kitchen sink repairing a pipe, realistic tools, residential kitchen, natural indoor light, no text, no logo",
  },
  {
    id: "electrical",
    match: /electr/,
    prompt:
      "Photorealistic photo of an electrician at a home breaker panel, careful work, residential garage, natural light, no text, no logo",
  },
  {
    id: "garage",
    match: /garage/,
    prompt:
      "Photorealistic photo of a technician repairing a residential garage door opener on a raised door, suburban driveway, daylight, no text, no logo",
  },
  {
    id: "landscape",
    match: /landscap|lawn/,
    prompt:
      "Photorealistic photo of a landscaper mowing and edging a tidy suburban lawn, Pacific Northwest greenery, daylight, no text, no logo",
  },
  {
    id: "paint",
    match: /paint/,
    prompt:
      "Photorealistic photo of a painter rolling a living room wall, drop cloths on the floor, residential interior, natural light, no text, no logo",
  },
  {
    id: "tree",
    match: /tree/,
    prompt:
      "Photorealistic photo of a tree-service crew trimming a large tree beside a house, safety gear, suburban lot, daylight, no text, no logo",
  },
  {
    id: "fence",
    match: /fence/,
    prompt:
      "Photorealistic photo of fence contractors setting a wood privacy fence in a backyard, posts and level, daylight, no text, no logo",
  },
  {
    id: "concrete",
    match: /concrete|mason/,
    prompt:
      "Photorealistic photo of concrete workers finishing a residential driveway slab, trowels, suburban house in background, daylight, no text, no logo",
  },
  {
    id: "cleaning",
    match: /clean|pressure wash|carpet clean|junk/,
    prompt:
      "Photorealistic photo of a house cleaner wiping a bright kitchen counter, realistic residential interior, natural light, no text, no logo",
  },
  {
    id: "gutter",
    match: /gutter/,
    prompt:
      "Photorealistic photo of a technician on a ladder cleaning rain gutters on a suburban house, daylight, no text, no logo",
  },
  {
    id: "siding",
    match: /sid(e|ing)|window/,
    prompt:
      "Photorealistic photo of contractors installing vinyl siding and a new window on a house exterior, daylight, no text, no logo",
  },
  {
    id: "handyman",
    match: /handyman|general contractor|remodel|builder/,
    prompt:
      "Photorealistic photo of a handyman assembling a bathroom vanity in a residential remodel, tools on the floor, natural light, no text, no logo",
  },
] as const;

export const DEFAULT_TRADE_PACK = {
  id: "default",
  prompt:
    "Photorealistic photo of a local home-service contractor talking with a homeowner on a suburban porch, Pacific Northwest, daylight, no text, no logo",
} as const;

export function tradePackId(niche: string): string {
  const n = niche.toLowerCase();
  const pack = TRADE_PACKS.find((item) => item.match.test(n));
  return pack?.id ?? DEFAULT_TRADE_PACK.id;
}

export function nicheHeroPhoto(niche: string): string {
  return `/company-site/${tradePackId(niche)}.jpg`;
}
