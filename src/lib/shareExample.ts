import { buildShareLines } from "./shareListing";

export const SHARE_HINT_STORAGE_KEY = "sc-share-hint-v1";

export const SHARE_EXAMPLE = {
  slug: "valley-ridge-electric",
  name: "Valley Ridge Electric",
  category: "Electrician",
  city: "Spokane Valley",
  phone: "(509) 555-0198",
  website: "https://valleyridgeelectric.example",
  rating: 5,
  reviewCount: 128,
};

export function shareExampleLines(origin = "https://spokanelist.com") {
  return buildShareLines(SHARE_EXAMPLE, origin);
}

export function shareExampleClipboard(origin?: string) {
  return shareExampleLines(origin).join("\n");
}
