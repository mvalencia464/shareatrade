import {
  formatPhone,
  isContractorCategory,
  normalizeCity,
  resolveWaOrIdLocation,
  slugify,
} from "./import-lib.mjs";

export const SOURCE = "localprospects";

export function hostnameFromDomain(value) {
  const raw = String(value).trim();
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./, "").toLowerCase();
  }
}

function socialsFromWeb(socials) {
  if (!socials || typeof socials !== "object") return [];
  return Object.entries(socials)
    .filter(([, url]) => typeof url === "string" && url.startsWith("http"))
    .map(([platform, url]) => ({
      platform: platform.toLowerCase(),
      url,
    }));
}

export function inferCategory(business, domain) {
  const category = String(business.category ?? "").trim();
  if (isContractorCategory(category)) return category;

  const blob = [
    business.name,
    domain,
    business.website,
    business.web?.meta_description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (blob.includes("deck")) return "Deck builder";
  return category;
}

function cidFromSchema(business) {
  const schemas = business.web?.schema_org;
  if (!Array.isArray(schemas)) return undefined;
  for (const schema of schemas) {
    const mapUrl = schema?.hasMap;
    if (typeof mapUrl !== "string") continue;
    const hex = mapUrl.match(/:0x([0-9a-f]+)/i)?.[1];
    if (hex) return BigInt(`0x${hex}`).toString();
  }
  return undefined;
}

/** Normalize enrich or search result rows into the enrich-shaped object. */
export function normalizeBusiness(row) {
  if (!row || typeof row !== "object") return null;
  if (row.result && typeof row.result === "object") {
    return normalizeBusiness(row.result);
  }
  if (row.contact || row.reputation || row.web) {
    return row;
  }
  return {
    name: row.name,
    category: row.category,
    website: row.website,
    phone: row.phone,
    email: row.email,
    rank: row.rank ?? row.google_maps_rank,
    google_cid: row.google_cid ?? row.googleCid ?? row.cid,
    gbp_url: row.gbp_url ?? row.gbpUrl,
    logo: row.logo ?? row.logo_url,
    main_image: row.main_image ?? row.main_image_url,
    contact: {
      address: row.address,
      city: row.city ?? row.contact?.city,
      state: row.state ?? row.contact?.state,
      state_code: row.state_code ?? row.contact?.state_code,
    },
    reputation: {
      rating: row.rating,
      reviews: row.reviews ?? row.review_count,
      is_claimed: row.claimed ?? row.is_claimed,
    },
    web: row.web,
  };
}

export function mapBusiness(raw, domain) {
  const business = normalizeBusiness(raw);
  if (!business) {
    return { name: "", category: "", location: null, contractor: null };
  }
  const contact = business.contact ?? {};
  const reputation = business.reputation ?? {};
  const name = String(business.name ?? "").trim();
  const category = inferCategory(business, domain);
  const host = domain ? hostnameFromDomain(domain) : "";
  const googleCid =
    String(
      business.google_cid ?? business.googleCid ?? business.cid ?? "",
    ).trim() ||
    cidFromSchema(business) ||
    (host ? `lp:${host}` : `lp:${slugify(name) || "unknown"}`);
  const gbpUrl =
    business.gbp_url ||
    (googleCid.startsWith("lp:")
      ? undefined
      : `https://www.google.com/maps?cid=${googleCid}`);

  const location = resolveWaOrIdLocation(
    contact.state_code || contact.state,
    contact.city,
  );

  return {
    name,
    category,
    location,
    stateRaw: contact.state_code || contact.state,
    cityRaw: contact.city,
    contractor: {
      marketSlug: "spokane",
      slug: slugify(name) || slugify(host) || "contractor",
      name,
      googleCid,
      googleMapsRank: Number(business.rank) || 0,
      category,
      city: normalizeCity(contact.city) ?? "",
      state: location?.state,
      website: business.website || (host ? `https://${host}` : undefined),
      gbpUrl: gbpUrl || undefined,
      phone: formatPhone(business.phone),
      email: business.email || undefined,
      address: contact.address || undefined,
      rating:
        typeof reputation.rating === "number" ? reputation.rating : undefined,
      reviewCount:
        typeof reputation.reviews === "number" ? reputation.reviews : undefined,
      claimed: Boolean(reputation.is_claimed),
      logoUrl: business.logo || undefined,
      mainImageUrl: business.main_image || undefined,
      socials: socialsFromWeb(business.web?.socials),
      source: SOURCE,
      sourceUpdatedAt: Date.now(),
    },
  };
}
