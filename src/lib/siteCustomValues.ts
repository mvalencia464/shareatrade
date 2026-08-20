import { formatPhone, phoneTelHref } from "./phone";
import { getMarket, marketCoreCities, type Market } from "./markets";

export type ContractorSiteSource = {
  slug: string;
  name: string;
  category: string;
  marketSlug?: string;
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

function isMarketCity(city: string | undefined, market: Market | undefined): boolean {
  if (!city || !market) return false;
  const key = normalizeCity(city);
  const aliases = marketCoreCities(market.slug);
  if (aliases.has(key)) return true;
  return key === market.name.toLowerCase();
}

export function deriveServiceArea(
  city?: string,
  state?: string,
  marketSlug?: string,
): string {
  const cityLabel = city?.trim();
  const stateLabel = state?.trim();
  const place = [cityLabel, stateLabel].filter(Boolean).join(", ");
  const market = marketSlug ? getMarket(marketSlug) : undefined;

  if (cityLabel && isMarketCity(cityLabel, market)) {
    const area = market ? `the greater ${market.name} area` : "the local area";
    return place ? `${place} and ${area}` : area;
  }

  if (place) return place;
  if (market) return `the ${market.name} area`;
  return "the local area";
}

export function siteCustomValues(source: ContractorSiteSource): SiteCustomValues {
  const service_area = deriveServiceArea(
    source.city,
    source.state,
    source.marketSlug,
  );
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

export function serviceAreaChips(city?: string, marketSlug?: string): string[] {
  const market = marketSlug ? getMarket(marketSlug) : undefined;
  const chips = [...(market?.cityAliases ?? [])].slice(0, 6);
  const hometown = city?.trim();
  if (!hometown || chips.length === 0) return chips;
  const already = chips.some(
    (chip) => chip.toLowerCase() === hometown.toLowerCase(),
  );
  if (already) return chips;
  return [hometown, ...chips.filter((chip) => chip.toLowerCase() !== hometown.toLowerCase())].slice(0, 6);
}

export function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}
