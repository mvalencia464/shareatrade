export const SITE_NAME = "Spokane List";
export const CONTACT_EMAIL = "hello@spokanelist.com";

export function contractorHelpMailto() {
  const subject = encodeURIComponent("Help with my listing");
  const body = encodeURIComponent(
    "Hi — I have a listing on Spokane List and may want a hand with Google reviews, my Business Profile, or a simple website.\n\nBusiness name:\nCity:\n",
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
