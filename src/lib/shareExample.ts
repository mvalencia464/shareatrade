export const SHARE_HINT_STORAGE_KEY = "sc-share-hint-v1";

export const SHARE_EXAMPLE = {
  name: "Valley Ridge Electric",
  category: "Electrician",
  city: "Spokane Valley",
  phone: "(509) 555-0198",
  website: "https://valleyridgeelectric.example",
  path: "/contractors/valley-ridge-electric",
};

export function shareExampleLines(origin = "https://spokanecontractors.com") {
  return [
    SHARE_EXAMPLE.name,
    `${SHARE_EXAMPLE.category} · ${SHARE_EXAMPLE.city}`,
    SHARE_EXAMPLE.phone,
    SHARE_EXAMPLE.website,
    `${origin}${SHARE_EXAMPLE.path}`,
  ];
}

export function shareExampleClipboard(origin?: string) {
  return shareExampleLines(origin).join("\n");
}
