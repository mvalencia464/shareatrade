import { formatPhone, phoneTelHref } from "./phone";

const GREATER_SPOKANE_CITIES = new Set(
  [
    "spokane",
    "spokane valley",
    "liberty lake",
    "airway heights",
    "cheney",
    "medical lake",
    "deer park",
    "millwood",
    "mead",
    "otis orchards",
    "greenacres",
    "veradale",
    "nine mile falls",
    "colbert",
    "chattaroy",
    "fairchild afb",
    "spangle",
    "marshall",
    "town and country",
    "country homes",
  ].map((c) => c.replace(/\s+/g, " ").trim()),
);

export type ContractorSiteSource = {
  slug: string;
  name: string;
  category: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  gbpUrl?: string;
  rating?: number;
  reviewCount?: number;
  logoUrl?: string;
  mainImageUrl?: string;
  licenseNumber?: string;
  licenseStatus?: string;
  licenseType?: string;
  socials?: Array<{ platform: string; url: string }>;
};

export type SiteCustomValues = {
  slug: string;
  business_name: string;
  niche: string;
  city: string | undefined;
  state: string | undefined;
  phone: string | undefined;
  phone_tel: string | undefined;
  rating: number | undefined;
  reviews: number | undefined;
  gbp_url: string | undefined;
  address: string | undefined;
  website: string | undefined;
  email: string | undefined;
  logo_url: string | undefined;
  cover_url: string | undefined;
  license_number: string | undefined;
  license_status: string | undefined;
  license_type: string | undefined;
  socials: Array<{ platform: string; url: string }>;
  service_area: string;
  proof_line: string;
};

function normalizeCity(city: string): string {
  return city.replace(/\s+/g, " ").trim().toLowerCase();
}

function isGreaterSpokaneCity(city: string | undefined): boolean {
  if (!city) return false;
  const key = normalizeCity(city);
  if (GREATER_SPOKANE_CITIES.has(key)) return true;
  return key.includes("spokane");
}

export function deriveServiceArea(city?: string, state?: string): string {
  const cityLabel = city?.trim();
  const stateLabel = state?.trim();
  const place = [cityLabel, stateLabel].filter(Boolean).join(", ");

  if (cityLabel && isGreaterSpokaneCity(cityLabel)) {
    return place
      ? `${place} and the greater Spokane area`
      : "the greater Spokane area";
  }

  if (place) return place;
  return "the Inland Northwest";
}

export function siteCustomValues(source: ContractorSiteSource): SiteCustomValues {
  const service_area = deriveServiceArea(source.city, source.state);
  const niche = source.category.trim();
  const business_name = source.name.trim();

  return {
    slug: source.slug,
    business_name,
    niche,
    city: source.city?.trim() || undefined,
    state: source.state?.trim() || undefined,
    phone: formatPhone(source.phone) || undefined,
    phone_tel: phoneTelHref(source.phone),
    rating: source.rating,
    reviews: source.reviewCount,
    gbp_url: source.gbpUrl,
    address: source.address?.trim() || undefined,
    website: source.website?.trim() || undefined,
    email: source.email?.trim() || undefined,
    logo_url: source.logoUrl,
    cover_url: source.mainImageUrl,
    license_number: source.licenseNumber?.trim() || undefined,
    license_status: source.licenseStatus?.trim() || undefined,
    license_type: source.licenseType?.trim() || undefined,
    socials: source.socials ?? [],
    service_area,
    proof_line: `${business_name} is a local ${niche.toLowerCase()} serving ${service_area}.`,
  };
}

export type SiteChannel = {
  key: string;
  href: string;
  label: string;
  kind: string;
};

function socialLabel(platform: string) {
  const p = platform.trim();
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : "Social";
}

export function siteChannels(values: SiteCustomValues): SiteChannel[] {
  const channels: SiteChannel[] = [];
  if (values.website) {
    channels.push({
      key: "website",
      href: values.website,
      label: "Website",
      kind: "website",
    });
  }
  if (values.gbp_url) {
    channels.push({
      key: "gbp",
      href: values.gbp_url,
      label: "Google",
      kind: "gbp",
    });
  }
  if (values.email) {
    channels.push({
      key: "email",
      href: `mailto:${values.email}`,
      label: "Email",
      kind: "email",
    });
  }
  for (const social of values.socials) {
    const url = social.url?.trim();
    if (!url) continue;
    channels.push({
      key: `${social.platform}-${url}`,
      href: url,
      label: socialLabel(social.platform),
      kind: social.platform,
    });
  }
  return channels;
}

const METRO_CHIPS = [
  "South Hill",
  "Spokane Valley",
  "Liberty Lake",
  "Mead",
  "Nine Mile Falls",
];

export function serviceAreaChips(city?: string): string[] {
  const hometown = city?.trim();
  if (!hometown) return METRO_CHIPS;
  const already = METRO_CHIPS.some(
    (chip) => chip.toLowerCase() === hometown.toLowerCase(),
  );
  if (already || hometown.toLowerCase() === "spokane") return METRO_CHIPS;
  return [hometown, ...METRO_CHIPS];
}

export function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}
