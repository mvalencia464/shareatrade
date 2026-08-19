import type { SiteCustomValues } from "./siteCustomValues";

const MEDIA = "https://media.stokeleads.com/spokanesummit";
const AVATAR = "https://randomuser.me/api/portraits";

export type DemoReview = {
  name: string;
  city: string;
  date: string;
  rating: number;
  avatar: string;
  text: string;
};

export type DemoTeamMember = {
  name: string;
  role: string;
  photo: string;
  blurb: string;
};

export type DemoProject = {
  src: string;
  place: string;
  label: string;
};

export function demoAbout(values: SiteCustomValues) {
  const owner = "Alex Rivera";
  const city = values.city ?? "Spokane";
  const niche = values.niche.toLowerCase();
  return {
    kicker: "Our story",
    quote: "We're not comfortable until you are.",
    owner,
    ownerTitle: `Owner, ${values.business_name}`,
    photo: `${MEDIA}/jordan.avif`,
    intro: `When the last crew left you hanging — or something failed at the worst time — you need someone who shows up, explains the work clearly, and treats your home like it matters. That's how ${owner} built ${values.business_name}.`,
    body: `We're a small ${niche} company, local to ${city}. No big marketing agency. No corporate playbook. Family-run, serving ${values.service_area}. Honest work. Fair pricing. We do the job right and we don't disappear after the invoice.`,
    cta: "Talk to the owner",
  };
}

export const DEMO_REVIEWS: DemoReview[] = [
  {
    name: "Jessica M.",
    city: "Spokane, WA",
    date: "Aug 2, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/44.jpg`,
    text: "They showed up when they said they would, walked me through the options, and the price matched the quote. Felt like a neighbor, not a sales pitch.",
  },
  {
    name: "Mark D.",
    city: "Spokane, WA",
    date: "Jul 18, 2026",
    rating: 5,
    avatar: `${AVATAR}/men/32.jpg`,
    text: "Had a mess after a previous vendor. They explained what was actually wrong, fixed it, and left the place cleaner than they found it.",
  },
  {
    name: "Sarah T.",
    city: "Spokane Valley, WA",
    date: "Jul 3, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/68.jpg`,
    text: "From the first call to the last walkthrough, everything was calm and clear. I finally stopped worrying about it.",
  },
  {
    name: "Daniel K.",
    city: "Liberty Lake, WA",
    date: "Jun 21, 2026",
    rating: 5,
    avatar: `${AVATAR}/men/11.jpg`,
    text: "Small crew, no runaround. They treated the house like it was theirs. I'd call them again in a heartbeat.",
  },
  {
    name: "Priya N.",
    city: "South Hill, WA",
    date: "Jun 8, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/21.jpg`,
    text: "Honest about what we needed vs. what we didn't. That's rare. Fair price and they finished on time.",
  },
  {
    name: "Chris B.",
    city: "Mead, WA",
    date: "May 27, 2026",
    rating: 4,
    avatar: `${AVATAR}/men/75.jpg`,
    text: "Took a day longer than hoped because of weather, but they kept us posted and the work looks solid.",
  },
  {
    name: "Lauren P.",
    city: "Cheney, WA",
    date: "May 12, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/12.jpg`,
    text: "Called in the morning, had someone out the same afternoon. Explained everything without talking down to me.",
  },
  {
    name: "Omar H.",
    city: "Airway Heights, WA",
    date: "Apr 29, 2026",
    rating: 5,
    avatar: `${AVATAR}/men/22.jpg`,
    text: "No corporate script. Just a local owner who cared whether the job actually held up. That's why I hired them.",
  },
  {
    name: "Emily R.",
    city: "Nine Mile Falls, WA",
    date: "Apr 14, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/33.jpg`,
    text: "They showed photos of similar work, answered every question, and didn't pressure us. The result looks great.",
  },
  {
    name: "Nate S.",
    city: "Deer Park, WA",
    date: "Mar 30, 2026",
    rating: 5,
    avatar: `${AVATAR}/men/41.jpg`,
    text: "We've used bigger companies before. This felt simpler and more careful. Clean job, fair invoice.",
  },
  {
    name: "Maya L.",
    city: "Millwood, WA",
    date: "Mar 11, 2026",
    rating: 5,
    avatar: `${AVATAR}/women/47.jpg`,
    text: "They treated our home like it mattered — drop cloths, quiet hours, and a clear wrap-up. Would recommend to a neighbor.",
  },
  {
    name: "Greg W.",
    city: "Colbert, WA",
    date: "Feb 22, 2026",
    rating: 5,
    avatar: `${AVATAR}/men/52.jpg`,
    text: "Straight answers, no upsell theater. They did what they said they'd do and checked back after.",
  },
];

export const DEMO_TEAM: DemoTeamMember[] = [
  {
    name: "Jordan Hale",
    role: "Crew lead",
    photo: `${MEDIA}/jordan.avif`,
    blurb: "Clear path, no shortcuts, nobody left guessing.",
  },
  {
    name: "Maya Chen",
    role: "Finish & detail",
    photo: `${MEDIA}/maya.avif`,
    blurb: "Catches the stuff you'd notice from the driveway.",
  },
  {
    name: "Chris Brooks",
    role: "Diagnostics",
    photo: `${MEDIA}/chris.avif`,
    blurb: "Finds the real problem before it finds your weekend.",
  },
  {
    name: "Elena Vale",
    role: "Estimating",
    photo: `${MEDIA}/elena.avif`,
    blurb: "Quotes you can actually understand. No mystery fees.",
  },
  {
    name: "Claire Quinn",
    role: "Field tech",
    photo: `${MEDIA}/claire.avif`,
    blurb: "Shows up ready, leaves the place better than she found it.",
  },
];

export const DEMO_PROJECTS: DemoProject[] = [
  { src: `${MEDIA}/roofing-12.avif`, place: "Spokane Valley", label: "Recent work" },
  { src: `${MEDIA}/roofing-16.avif`, place: "South Hill", label: "Recent work" },
  { src: `${MEDIA}/roofing-2.avif`, place: "Liberty Lake", label: "Recent work" },
  { src: `${MEDIA}/roofing-7.avif`, place: "Mead", label: "Recent work" },
  { src: `${MEDIA}/roofing-14.avif`, place: "Cheney", label: "Recent work" },
  { src: `${MEDIA}/metal2.avif`, place: "Nine Mile Falls", label: "Recent work" },
];

export const DEMO_CREW_PHOTO = `${MEDIA}/crew.avif`;
