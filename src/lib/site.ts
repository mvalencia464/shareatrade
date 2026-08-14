export const SITE_NAME = "Spokane List";
export const CONTACT_NAME = "Mauricio Valencia";
export const CONTACT_EMAIL = "hello@spokanelist.com";
export const CONTACT_PHOTO = "/mauricio.webp";

export const RESERVED_LISTING_SLUGS = [
  "get-listed",
  "for-contractors",
  "how-it-works",
    "hiring-help",
    "why",
    "contractors",
] as const;

export function listingPath(slug: string) {
  return `/${slug}`;
}

export function listingUrl(slug: string, origin?: string) {
  const path = listingPath(slug);
  if (origin) return `${origin}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export function contractorHelpMailto() {
  const subject = encodeURIComponent("Help with my listing");
  const body = encodeURIComponent(
    "Hi — I have a listing on Spokane List and may want a hand with Google reviews, my Business Profile, or a simple website.\n\nBusiness name:\nCity:\n",
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
