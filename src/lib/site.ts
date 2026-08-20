export const SITE_NAME = "shareatrade";
export const SITE_ORIGIN = "https://shareatrade.com";
export const CONTACT_NAME = "Mauricio Valencia";
export const CONTACT_EMAIL = "hello@shareatrade.com";
export const CONTACT_PHOTO = "/mauricio.webp";

export const RESERVED_LISTING_SLUGS = [
  "get-listed",
  "for-contractors",
  "how-it-works",
  "hiring-help",
  "why",
  "terms",
  "contractors",
  "go",
] as const;

export function directoryPath(marketSlug: string) {
  return `/${marketSlug}/`;
}

export function listingPath(marketSlug: string, slug: string) {
  return `/${marketSlug}/${slug}/`;
}

export function companySitePath(marketSlug: string, slug: string) {
  return `/go/${marketSlug}/${slug}/`;
}

export function uniqueBySlug<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

export function listingUrl(
  marketSlug: string,
  slug: string,
  origin?: string,
) {
  const path = listingPath(marketSlug, slug);
  if (origin) return `${origin}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export function contractorHelpMailto() {
  const subject = encodeURIComponent("Help with my listing");
  const body = encodeURIComponent(
    "Hi — I have a listing on shareatrade and may want a hand with Google reviews, my Business Profile, or a simple website.\n\nBusiness name:\nCity:\n",
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
