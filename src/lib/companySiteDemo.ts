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
  blurb: string;
};

export type DemoProject = {
  src: string;
  place: string;
  label: string;
};

export type NicheService = {
  name: string;
  blurb: string;
};

export type NicheVoice = {
  quote: string;
  problem: string;
  crewLine: string;
  callCta: string;
  formCta: string;
  formPrompt: string;
  services: NicheService[];
};

export function nicheVoice(niche: string): NicheVoice {
  const n = niche.toLowerCase();

  if (/hvac|air cond|heating|furnace|heat pump|cooling/.test(n)) {
    return {
      quote: "We're not comfortable until you are.",
      problem:
        "When the AC dies before a heat wave — or the last tech left you with a half-fixed system —",
      crewLine: "Meet the folks who keep your house livable",
      callCta: "Get my cool air back",
      formCta: "Get my cool air back",
      formPrompt: "What's going on with the heat or AC?",
      services: [
        { name: "Same-day repair", blurb: "No cool air, no heat, weird noises — we diagnose and fix." },
        { name: "Seasonal tune-ups", blurb: "Spring AC and fall furnace checks before the rush." },
        { name: "Full installs", blurb: "New systems sized for Spokane winters and summer heat." },
        { name: "Heat pumps", blurb: "Repair, swap, or a first-time install done clearly." },
      ],
    };
  }
  if (/roof/.test(n)) {
    return {
      quote: "We're not done until you stay dry.",
      problem:
        "When meltwater hits a stain on the ceiling — or the last crew disappeared after a patch —",
      crewLine: "Meet the folks who keep Spokane dry",
      callCta: "Stop this leak",
      formCta: "Get a roof quote",
      formPrompt: "Leak, missing shingles, or a full replacement?",
      services: [
        { name: "Leak repair", blurb: "Find the drip, patch it, and keep meltwater out of the house." },
        { name: "Full replacement", blurb: "Tear-off and new roof built for snow load." },
        { name: "Ice dam help", blurb: "Safe removal plus a plan so it doesn't come back." },
        { name: "Inspections", blurb: "A clear look at valleys, vents, and what's actually failing." },
      ],
    };
  }
  if (/pest|termite|rodent/.test(n)) {
    return {
      quote: "We're not done until they're gone.",
      problem:
        "When you hear them in the walls — or a spray last month didn't stick —",
      crewLine: "Meet the folks who keep the pests out",
      callCta: "Get them out of my house",
      formCta: "Get a pest quote",
      formPrompt: "What are you seeing or hearing?",
      services: [
        { name: "Interior & exterior treatment", blurb: "Ants, spiders, and the stuff sneaking in from the yard." },
        { name: "Rodent control", blurb: "Find how they got in, get them out, seal the gaps." },
        { name: "Termite inspection", blurb: "A real look at wood and soil — not a scare script." },
        { name: "Follow-up visits", blurb: "We come back until the activity actually stops." },
      ],
    };
  }
  if (/plumb/.test(n)) {
    return {
      quote: "We're not done until the drip stops.",
      problem:
        "When the water won't shut off — or the last fix started leaking again —",
      crewLine: "Meet the folks who keep the water where it belongs",
      callCta: "Stop this leak",
      formCta: "Get a plumbing quote",
      formPrompt: "Leak, clog, water heater, or something else?",
      services: [
        { name: "Leak repair", blurb: "Under the sink, in the wall, or a slab drip." },
        { name: "Clog clearing", blurb: "Drains and mains without the runaround." },
        { name: "Water heaters", blurb: "Repair, flush, or a clean replacement." },
        { name: "Fixture installs", blurb: "Taps, toilets, and trim that actually shut off." },
      ],
    };
  }
  if (/electr/.test(n)) {
    return {
      quote: "We're not done until it's safe.",
      problem:
        "When a breaker keeps tripping — or a previous job left you guessing —",
      crewLine: "Meet the folks who keep the power honest",
      callCta: "Get this checked",
      formCta: "Get an electrical quote",
      formPrompt: "What's flickering, tripping, or needs installing?",
      services: [
        { name: "Panel & breaker work", blurb: "Trips, upgrades, and labeling you can follow." },
        { name: "Outlets & lighting", blurb: "Adds, swaps, and the dead half of a kitchen circuit." },
        { name: "Safety checks", blurb: "GFCIs, smoke/CO, and a walkthrough of what's sketchy." },
        { name: "EV charger & extras", blurb: "Dedicated circuits done to code, explained first." },
      ],
    };
  }
  if (/garage/.test(n)) {
    return {
      quote: "We're not done until it opens every time.",
      problem: "When the door slams, stalls, or won't close at night —",
      crewLine: "Meet the folks who keep the door moving",
      callCta: "Fix my garage door",
      formCta: "Get a garage-door quote",
      formPrompt: "Opener, springs, or the door itself?",
      services: [
        { name: "Opener repair", blurb: "Remotes, sensors, and motors that quit mid-travel." },
        { name: "Springs & cables", blurb: "The parts that fail loud — replaced safely." },
        { name: "New doors", blurb: "Insulated doors that actually fit the opening." },
        { name: "Tune-ups", blurb: "Balance, lube, and a quieter close." },
      ],
    };
  }
  if (/landscap|lawn/.test(n)) {
    return {
      quote: "We're not done until the yard looks lived-in.",
      problem: "When the last crew mowed and vanished — or the beds never got finished —",
      crewLine: "Meet the folks who keep the yard in shape",
      callCta: "Get my yard back",
      formCta: "Get a yard quote",
      formPrompt: "Mow, cleanup, or a bigger landscape job?",
      services: [
        { name: "Mow & maintain", blurb: "A regular route, not a one-and-done hack job." },
        { name: "Cleanup", blurb: "Leaves, debris, and the stuff winter left behind." },
        { name: "Beds & planting", blurb: "Mulch, shrubs, and edges that stay neat." },
        { name: "Irrigation checks", blurb: "Heads that actually cover the lawn." },
      ],
    };
  }
  if (/paint/.test(n)) {
    return {
      quote: "We're not done until the cut lines are clean.",
      problem: "When the last paint job peeled — or the color looked different in daylight —",
      crewLine: "Meet the folks who keep the walls honest",
      callCta: "Get this painted right",
      formCta: "Get a paint quote",
      formPrompt: "Interior, exterior, or both?",
      services: [
        { name: "Interior painting", blurb: "Rooms, trim, and ceilings without the slop." },
        { name: "Exterior painting", blurb: "Prep that survives freeze–thaw, not just a coat." },
        { name: "Cabinets & trim", blurb: "The details people notice from the doorway." },
        { name: "Color help", blurb: "Samples on your wall, not a guess from a chip." },
      ],
    };
  }
  if (/tree/.test(n)) {
    return {
      quote: "We're not done until the risk is down.",
      problem: "When a limb hangs over the roof — or a storm left a mess —",
      crewLine: "Meet the folks who keep the trees in check",
      callCta: "Get this tree handled",
      formCta: "Get a tree quote",
      formPrompt: "Trim, take-down, or storm damage?",
      services: [
        { name: "Trimming", blurb: "Clear the roof and lines without butchering the tree." },
        { name: "Removals", blurb: "Take-downs with a plan for the fall zone." },
        { name: "Storm cleanup", blurb: "Downed wood off the driveway and house." },
        { name: "Stump grinding", blurb: "So you're not mowing around a leftover." },
      ],
    };
  }
  if (/fence/.test(n)) {
    return {
      quote: "We're not done until the line is straight.",
      problem: "When the wind took a panel — or the old fence is leaning into the alley —",
      crewLine: "Meet the folks who keep the line honest",
      callCta: "Fix my fence",
      formCta: "Get a fence quote",
      formPrompt: "Repair, new run, or gates?",
      services: [
        { name: "Repairs", blurb: "Posts, panels, and gates that sag." },
        { name: "New fence", blurb: "Wood, vinyl, or chain-link with a clean line." },
        { name: "Gates", blurb: "Hardware that latches in winter too." },
        { name: "Post replacement", blurb: "The rotten ones before the whole run goes." },
      ],
    };
  }
  if (/concrete|mason/.test(n)) {
    return {
      quote: "We're not done until it stays level.",
      problem: "When the walk heaves — or a patch from last year already cracked —",
      crewLine: "Meet the folks who keep it from crumbling",
      callCta: "Get this concrete fixed",
      formCta: "Get a concrete quote",
      formPrompt: "Driveway, patio, or steps?",
      services: [
        { name: "Driveways & walks", blurb: "New pours that drain the right way." },
        { name: "Patios & slabs", blurb: "Flat, finished, and built for freeze–thaw." },
        { name: "Steps & repair", blurb: "Trip hazards and spalls before someone falls." },
        { name: "Sealing", blurb: "A coat that actually buys you another season." },
      ],
    };
  }
  if (/clean|pressure wash|carpet clean|junk/.test(n)) {
    return {
      quote: "We're not done until you can use the room.",
      problem: "When the last clean didn't last — or the gunk is past a mop —",
      crewLine: "Meet the folks who leave it actually clean",
      callCta: "Get this cleaned",
      formCta: "Get a cleaning quote",
      formPrompt: "House, carpets, or a one-time mess?",
      services: [
        { name: "House cleaning", blurb: "Kitchens, baths, and the floors you actually walk." },
        { name: "Deep clean", blurb: "Move-in, move-out, or after a project." },
        { name: "Carpet & upholstery", blurb: "Stains and the smell that hangs on." },
        { name: "Exterior wash", blurb: "Siding, walks, and the driveway film." },
      ],
    };
  }
  if (/gutter/.test(n)) {
    return {
      quote: "We're not done until the water leaves the house.",
      problem: "When ice backs up or the overflow stains the fascia —",
      crewLine: "Meet the folks who keep the runoff moving",
      callCta: "Clear my gutters",
      formCta: "Get a gutter quote",
      formPrompt: "Cleaning, repair, or new gutters?",
      services: [
        { name: "Gutter cleaning", blurb: "Off the roof, out of the downspouts." },
        { name: "Repairs", blurb: "Seams, hangers, and the sag in the middle." },
        { name: "New gutters", blurb: "Sized for Spokane rain and snowmelt." },
        { name: "Downspout drainage", blurb: "Water away from the foundation, not into it." },
      ],
    };
  }
  if (/sid(e|ing)|window/.test(n)) {
    return {
      quote: "We're not done until the weather stays outside.",
      problem: "When a draft shows up or a panel is letting water in —",
      crewLine: "Meet the folks who keep the envelope tight",
      callCta: "Get this buttoned up",
      formCta: "Get an exterior quote",
      formPrompt: "Windows, siding, or both?",
      services: [
        { name: "Window replacement", blurb: "Units that shut, seal, and don't fog." },
        { name: "Siding repair", blurb: "The failed courses before the wall soaks." },
        { name: "Full siding", blurb: "A wrap that can take freeze–thaw." },
        { name: "Trim & flashing", blurb: "The details that keep water out." },
      ],
    };
  }
  if (/handyman|general contractor|remodel|builder/.test(n)) {
    return {
      quote: "We're not done until the punch list is empty.",
      problem: "When a list of small jobs keeps growing — or a remodel stalled —",
      crewLine: "Meet the folks who finish the list",
      callCta: "Get this off my list",
      formCta: "Get a project quote",
      formPrompt: "What's the job, start to finish?",
      services: [
        { name: "Repairs", blurb: "The stuff that's been on the list for months." },
        { name: "Installs", blurb: "Fans, fixtures, hardware — done once." },
        { name: "Small remodels", blurb: "A bath, a laundry, a wall that needs a plan." },
        { name: "Punch lists", blurb: "We walk it with you and close the extras." },
      ],
    };
  }

  return {
    quote: "We're not comfortable until you are.",
    problem:
      "When the last crew left you hanging — or something failed at the worst time —",
    crewLine: "Meet the folks who show up",
    callCta: "Talk to the owner",
    formCta: "Get my free quote",
    formPrompt: `A little about the ${n} job`,
    services: [
      { name: "Repair", blurb: `Fix what's failing — explained before we start.` },
      { name: "Install", blurb: `New work sized for the house, not a catalog upsell.` },
      { name: "Maintenance", blurb: `A tune-up so the next season isn't a surprise.` },
      { name: "Call-out", blurb: `Show up, look, and tell you what's actually going on.` },
    ],
  };
}

export function demoAbout(values: SiteCustomValues) {
  const owner = "Alex Rivera";
  const city = values.city ?? "Spokane";
  const niche = values.niche.toLowerCase();
  const voice = nicheVoice(values.niche);
  return {
    kicker: "Our story",
    quote: voice.quote,
    owner,
    ownerTitle: `Owner, ${values.business_name}`,
    photo: nicheHeroPhoto(values.niche),
    intro: `${voice.problem} you need someone who shows up, explains the work clearly, and treats your home like it matters. That's how ${owner} built ${values.business_name}.`,
    body: `We're a small ${niche} company, local to ${city}. No big marketing agency. No corporate playbook. Family-run, serving ${values.service_area}. Honest work. Fair pricing. We do the job right and we don't disappear after the invoice.`,
    callCta: voice.callCta,
    formCta: voice.formCta,
    formPrompt: voice.formPrompt,
    crewLine: voice.crewLine,
    services: voice.services,
  };
}

const U = "https://images.unsplash.com";

/** Shared stock hero per trade — labeled as stock on the page. */
export function nicheHeroPhoto(niche: string): string {
  const n = niche.toLowerCase();
  const shot = (id: string) =>
    `${U}/${id}?auto=format&fit=crop&w=1200&h=720&q=75`;

  if (/hvac|air cond|heating|furnace|heat pump|cooling/.test(n)) {
    return shot("photo-1621905251189-08b45d6a269e");
  }
  if (/roof/.test(n)) {
    return shot("photo-1560518883-ce09059eeffa");
  }
  if (/pest|termite|rodent/.test(n)) {
    return shot("photo-1584622781564-1d987f4950aa");
  }
  if (/plumb/.test(n)) {
    return shot("photo-1607472586893-ed4d7287bbed");
  }
  if (/electr/.test(n)) {
    return shot("photo-1473341304170-971dccb5ac1e");
  }
  if (/garage/.test(n)) {
    return shot("photo-1486262715619-67b85e0b08d3");
  }
  if (/landscap|lawn/.test(n)) {
    return shot("photo-1558904541-efa843a96f01");
  }
  if (/paint/.test(n)) {
    return shot("photo-1562259949-e8e7440dd3e5");
  }
  if (/tree/.test(n)) {
    return shot("photo-1502082553048-f009c37129b9");
  }
  if (/fence/.test(n)) {
    return shot("photo-1570129477492-45c003edd2be");
  }
  if (/concrete|mason/.test(n)) {
    return shot("photo-1517581178692-6c44790d4d11");
  }
  if (/clean|pressure wash|carpet clean|junk/.test(n)) {
    return shot("photo-1581578731548-c64695cc6952");
  }
  if (/gutter/.test(n)) {
    return shot("photo-1560518883-ce09059eeffa");
  }
  if (/sid(e|ing)|window/.test(n)) {
    return shot("photo-1600585154340-be6161a56a0c");
  }
  if (/handyman|general contractor|remodel|builder/.test(n)) {
    return shot("photo-1504148458007-edf7283d0d0d");
  }
  return shot("photo-1504307651254-35680f356dfd");
}

function crewPack(group: string, portraits: string[]) {
  const shot = (id: string, square = false) =>
    square
      ? `${U}/${id}?auto=format&fit=crop&w=800&h=800&q=75`
      : `${U}/${id}?auto=format&fit=crop&w=1200&h=720&q=75`;
  return {
    group: shot(group),
    portraits: portraits.map((id) => shot(id, true)),
  };
}

/** Stock crew photos per trade — same people names, niche-matching Unsplash shots. */
export function nicheCrewMedia(niche: string): {
  group: string;
  portraits: string[];
} {
  const n = niche.toLowerCase();

  if (/hvac|air cond|heating|furnace|heat pump|cooling/.test(n)) {
    return crewPack("photo-1621905251189-08b45d6a269e", [
      "photo-1581094794329-cce594b0c165",
      "photo-1581092160562-40aa08e78837",
      "photo-1504328345606-18bbc8c9d7d1",
      "photo-1572981779307-38b8cabb53db",
      "photo-1581092918056-0c4c3acd3789",
    ]);
  }
  if (/roof|gutter/.test(n)) {
    return crewPack("photo-1504307651254-35680f356dfd", [
      "photo-1560518883-ce09059eeffa",
      "photo-1590496793929-36417d3117de",
      "photo-1600585154340-be6161a56a0c",
      "photo-1541888946425-d81bb19240f5",
      "photo-1503387762-592deb58ef4e",
    ]);
  }
  if (/pest|termite|rodent/.test(n)) {
    return crewPack("photo-1584622781564-1d987f4950aa", [
      "photo-1581578731548-c64695cc6952",
      "photo-1584622650111-993a426fbf0a",
      "photo-1563453392212-326f5e854473",
      "photo-1615876234886-fd9a39fda97f",
      "photo-1582719471384-894fbb16e074",
    ]);
  }
  if (/plumb/.test(n)) {
    return crewPack("photo-1607472586893-ed4d7287bbed", [
      "photo-1585704032915-c3400ca199e7",
      "photo-1558618666-fcd25c85cd64",
      "photo-1504148458007-edf7283d0d0d",
      "photo-1581092160562-40aa08e78837",
      "photo-1607472586893-ed4d7287bbed",
    ]);
  }
  if (/electr/.test(n)) {
    return crewPack("photo-1473341304170-971dccb5ac1e", [
      "photo-1621905252507-b35492cc74b4",
      "photo-1558618666-fcd25c85cd64",
      "photo-1581092918056-0c4c3acd3789",
      "photo-1504328345606-18bbc8c9d7d1",
      "photo-1581094794329-cce594b0c165",
    ]);
  }
  if (/garage/.test(n)) {
    return crewPack("photo-1486262715619-67b85e0b08d3", [
      "photo-1487754180451-c456f9551c0c",
      "photo-1492144534655-ae79c964c9d7",
      "photo-1486262715619-67b85e0b08d3",
      "photo-1503376780353-7e6692767b70",
      "photo-1542362567-b07e54358753",
    ]);
  }
  if (/landscap|lawn/.test(n)) {
    return crewPack("photo-1558904541-efa843a96f01", [
      "photo-1416879595882-3373a0480b5b",
      "photo-1466692476866-aef1dfb1e735",
      "photo-1585320806297-9794b3e4eeae",
      "photo-1441974231531-c6227db76b6e",
      "photo-1470071459604-3b5ec3a7fe05",
    ]);
  }
  if (/paint/.test(n)) {
    return crewPack("photo-1562259949-e8e7440dd3e5", [
      "photo-1589939705384-5185137a7f0f",
      "photo-1562259949-e8e7440dd3e5",
      "photo-1504148458007-edf7283d0d0d",
      "photo-1595814433015-e6f5d246d049",
      "photo-1560185007-cde436f6a4d0",
    ]);
  }
  if (/tree/.test(n)) {
    return crewPack("photo-1502082553048-f009c37129b9", [
      "photo-1542273917363-3b1817f69a2d",
      "photo-1441974231531-c6227db76b6e",
      "photo-1502082553048-f009c37129b9",
      "photo-1473448912268-2022ce9509d8",
      "photo-1513836279014-a89f7a76ae86",
    ]);
  }
  if (/fence/.test(n)) {
    return crewPack("photo-1570129477492-45c003edd2be", [
      "photo-1564013799919-ab600027ffc6",
      "photo-1570129477492-45c003edd2be",
      "photo-1600585154340-be6161a56a0c",
      "photo-1560184897-ae75f418493e",
      "photo-1600047509807-ba8b95fda8c2",
    ]);
  }
  if (/concrete|mason/.test(n)) {
    return crewPack("photo-1517581178692-6c44790d4d11", [
      "photo-1504307651254-35680f356dfd",
      "photo-1581094794329-cce594b0c165",
      "photo-1503387762-592deb58ef4e",
      "photo-1517581178692-6c44790d4d11",
      "photo-1541888946425-d81bb19240f5",
    ]);
  }
  if (/clean|pressure wash|carpet clean|junk/.test(n)) {
    return crewPack("photo-1581578731548-c64695cc6952", [
      "photo-1584622650111-993a426fbf0a",
      "photo-1563453392212-326f5e854473",
      "photo-1581578731548-c64695cc6952",
      "photo-1527515637462-cff94eecc1ac",
      "photo-1556912173-3bb406ef7e77",
    ]);
  }
  if (/sid(e|ing)|window/.test(n)) {
    return crewPack("photo-1600585154340-be6161a56a0c", [
      "photo-1560518883-ce09059eeffa",
      "photo-1600047509358-9dc8ab45457b",
      "photo-1600585154526-990dced4db0d",
      "photo-1600566753190-17f0baa2a6c3",
      "photo-1600210492486-724fe5c67fb0",
    ]);
  }
  if (/handyman|general contractor|remodel|builder/.test(n)) {
    return crewPack("photo-1504148458007-edf7283d0d0d", [
      "photo-1504307651254-35680f356dfd",
      "photo-1581092160562-40aa08e78837",
      "photo-1504148458007-edf7283d0d0d",
      "photo-1581094794329-cce594b0c165",
      "photo-1503387762-592deb58ef4e",
    ]);
  }

  return crewPack("photo-1504307651254-35680f356dfd", [
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1494790108377-be9c29b29330",
    "photo-1472099645785-5658abf4ff4e",
    "photo-1438761681033-6461ffad8d80",
    "photo-1500648767791-00dcc994a43e",
  ]);
}

export function demoCrew(niche: string) {
  const media = nicheCrewMedia(niche);
  return {
    group: media.group,
    members: DEMO_TEAM.map((member, index) => ({
      ...member,
      photo: media.portraits[index] ?? media.group,
    })),
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
    blurb: "Clear path, no shortcuts, nobody left guessing.",
  },
  {
    name: "Maya Chen",
    role: "Finish & detail",
    blurb: "Catches the stuff you'd notice from the driveway.",
  },
  {
    name: "Chris Brooks",
    role: "Diagnostics",
    blurb: "Finds the real problem before it finds your weekend.",
  },
  {
    name: "Elena Vale",
    role: "Estimating",
    blurb: "Quotes you can actually understand. No mystery fees.",
  },
  {
    name: "Claire Quinn",
    role: "Field tech",
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
