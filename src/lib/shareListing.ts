import { formatPhone } from "./phone";
import { listingUrl } from "./site";

export type ShareContractor = {
  slug: string;
  name: string;
  category: string;
  city?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
};

export function buildShareLines(
  contractor: ShareContractor,
  origin?: string,
): string[] {
  const place = [contractor.category, contractor.city].filter(Boolean).join(" · ");
  const lines = [
    place
      ? `${contractor.name} (${place})`
      : contractor.name,
  ];

  if (typeof contractor.rating === "number") {
    const rating = contractor.rating.toFixed(1);
    const reviews = contractor.reviewCount;
    lines.push(
      typeof reviews === "number"
        ? `⭐ ${rating} (${reviews} Google review${reviews === 1 ? "" : "s"})`
        : `⭐ ${rating}`,
    );
  }

  if (contractor.phone) {
    lines.push(`📞 ${formatPhone(contractor.phone)}`);
  }
  if (contractor.website) {
    lines.push(`🌐 ${contractor.website}`);
  }
  lines.push(`🔗 Details & Portfolio: ${listingUrl(contractor.slug, origin)}`);
  return lines;
}

export function buildShareText(contractor: ShareContractor, origin?: string) {
  return buildShareLines(contractor, origin).join("\n");
}
