/**
 * Category allowlist helpers for the Spokane contractor CSV import.
 */

const CATEGORY_KEYWORDS = [
  "contractor",
  "construction",
  "builder",
  "remodel",
  "hvac",
  "electrician",
  "plumber",
  "plumbing",
  "roof",
  "landscap",
  "lawn",
  "pest",
  "concrete",
  "excav",
  "dry wall",
  "drywall",
  "insulation",
  "handyman",
  "handywoman",
  "handyperson",
  "painter",
  "painting",
  "flooring",
  "cabinet",
  "window",
  "siding",
  "fence",
  "fencing",
  "deck",
  "paving",
  "asphalt",
  "mason",
  "tile",
  "carpentry",
  "carpenter",
  "demolition",
  "foundation",
  "gutter",
  "septic",
  "well drilling",
  "tree service",
  "arborist",
  "water damage",
  "restoration",
  "mold",
  "asbestos",
  "waterproof",
  "garage door",
  "appliance repair",
  "heating",
  "cooling",
  "air conditioning",
  "furnace",
  "chimney",
  "welding",
  "home inspector",
  "kitchen remodel",
  "bathroom remodel",
  "interior designer",
  "architect",
  "surveyor",
  "civil engineer",
  "structural engineer",
  "pool",
  "irrigation",
  "sprinkler",
  "snow removal",
  "junk removal",
  "pressure wash",
  "power wash",
  "locksmith",
  "glass",
  "stucco",
  "epoxy",
  "countertop",
  "solar",
  "geothermal",
  "paver",
  "bricklayer",
  "plaster",
  "sheet metal",
  "fire damage",
  "basement waterproof",
  "radon",
  "sewer",
  "drain cleaning",
  "carpet cleaning",
  "house cleaning",
  "cleaning service",
];

const EXPLICIT_KEEP = new Set(
  [
    "Floor refinishing service",
    "Wood floor installation service",
    "Welder",
    "Woodworker",
    "Home automation company",
    "Drafting service",
  ].map((c) => c.toLowerCase()),
);

export function isContractorCategory(category) {
  const trimmed = category.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (EXPLICIT_KEEP.has(lower)) return true;
  if (
    /\b(store|supplier|market|dealer|agency|developer|organization|utility company)\b/.test(
      lower,
    )
  ) {
    return false;
  }
  return CATEGORY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Decode HTML entities commonly left in scraped city fields. */
export function decodeHtmlEntities(value) {
  return String(value)
    .replace(/\\?&#0*39;/gi, "'")
    .replace(/\\?&#x0*27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/** Fingerprint for city alias matching (letters/digits only). */
export function cityFingerprint(value) {
  return String(value)
    .toLowerCase()
    .replace(/[''`´′]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Canonical display names keyed by {@link cityFingerprint}. */
const CITY_CANONICAL_BY_FINGERPRINT = new Map([
  ["coeurdalene", "Coeur d'Alene"],
  ["spokanevly", "Spokane Valley"],
  ["spokanevalley", "Spokane Valley"],
  ["libertylake", "Liberty Lake"],
  ["postfalls", "Post Falls"],
  ["airwayheights", "Airway Heights"],
  ["ninemilefalls", "Nine Mile Falls"],
  ["medicallake", "Medical Lake"],
  ["newmanlake", "Newman Lake"],
  ["otisorchards", "Otis Orchards"],
]);

/** Non-city / multi-place junk that should not appear in the city filter. */
const CITY_REJECT_FINGERPRINTS = new Set([
  "ste204",
  "lakecoeurdalenehaydenlakeandthespokaneriver",
]);

/**
 * Normalize a free-text city for storage and exact-match filters.
 * Returns undefined when the value is empty or rejected junk.
 */
export function normalizeCity(city) {
  if (city == null) return undefined;

  let cleaned = decodeHtmlEntities(city)
    .replace(/\\+'/g, "'")
    .replace(/[’`´′]/g, "'")
    .replace(/[,.;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;

  const fingerprint = cityFingerprint(cleaned);
  if (CITY_REJECT_FINGERPRINTS.has(fingerprint)) return undefined;

  const canonical = CITY_CANONICAL_BY_FINGERPRINT.get(fingerprint);
  if (canonical) return canonical;

  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** @deprecated Prefer {@link normalizeCity}. */
export function titleCaseCity(city) {
  return normalizeCity(city) ?? "";
}

export function parseSocials(raw) {
  if (!raw.trim()) return [];
  const links = [];
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^([^:]+):\s*(https?:\/\/\S+)/i);
    if (match) {
      links.push({
        platform: match[1].trim().toLowerCase(),
        url: match[2].trim(),
      });
    }
  }
  return links;
}

export function optionalString(value) {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : undefined;
}

/** Normalize to (509) 768-5469 when possible. */
export function formatPhone(value) {
  if (!value) return undefined;
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    const trimmed = String(value).trim();
    return trimmed || undefined;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function parseNumber(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Normalize State CSV values to Washington | Idaho | undefined (blank/unknown),
 * or null if the listing is clearly outside WA/ID.
 * Also returns a city override when the State cell was clearly a city name.
 */
export function resolveWaOrIdLocation(stateRaw, cityRaw) {
  const state = (stateRaw ?? "").trim();
  const city = (cityRaw ?? "").trim();
  const lower = state.toLowerCase().replace(/’/g, "'");
  const stateFingerprint = cityFingerprint(decodeHtmlEntities(state));

  // Blank state: keep (Spokane-area scrape often omitted state)
  if (!lower) {
    return { state: undefined, city: city || undefined };
  }

  if (
    lower === "washington" ||
    lower === "wa" ||
    lower === "wash." ||
    lower === "wash"
  ) {
    return { state: "Washington", city: city || undefined };
  }

  if (
    lower === "idaho" ||
    lower === "id" ||
    lower === "northern idaho" ||
    lower.includes("idaho")
  ) {
    return { state: "Idaho", city: city || undefined };
  }

  // Misfiled city-as-state values that are still in WA/ID
  if (stateFingerprint === "coeurdalene") {
    return { state: "Idaho", city: city || "Coeur d'Alene" };
  }
  if (stateFingerprint === "meridian") {
    return { state: "Idaho", city: city || "Meridian" };
  }
  if (
    stateFingerprint === "spokane" ||
    stateFingerprint === "spokanevalley" ||
    stateFingerprint === "spokanevly"
  ) {
    return {
      state: "Washington",
      city: city || normalizeCity(state) || undefined,
    };
  }

  return null;
}

export function isWaOrIdState(stateRaw, cityRaw) {
  return resolveWaOrIdLocation(stateRaw, cityRaw) !== null;
}
