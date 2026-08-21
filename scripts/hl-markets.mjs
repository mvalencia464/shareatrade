/** Metro fallbacks for HighLevel city / state / timezone. */
export const MARKET_GEO = {
  spokane: { city: "Spokane", state: "WA", timezone: "America/Los_Angeles" },
  boise: { city: "Boise", state: "ID", timezone: "America/Boise" },
  raleigh: { city: "Raleigh", state: "NC", timezone: "America/New_York" },
  portland: { city: "Portland", state: "OR", timezone: "America/Los_Angeles" },
  indianapolis: {
    city: "Indianapolis",
    state: "IN",
    timezone: "America/Indiana/Indianapolis",
  },
  "kansas-city": { city: "Kansas City", state: "MO", timezone: "America/Chicago" },
  nashville: { city: "Nashville", state: "TN", timezone: "America/Chicago" },
  charlotte: { city: "Charlotte", state: "NC", timezone: "America/New_York" },
  "salt-lake": {
    city: "Salt Lake City",
    state: "UT",
    timezone: "America/Denver",
  },
  columbus: { city: "Columbus", state: "OH", timezone: "America/New_York" },
  denver: { city: "Denver", state: "CO", timezone: "America/Denver" },
  phoenix: { city: "Phoenix", state: "AZ", timezone: "America/Phoenix" },
  atlanta: { city: "Atlanta", state: "GA", timezone: "America/New_York" },
  "northern-virginia": {
    city: "Fairfax",
    state: "VA",
    timezone: "America/New_York",
  },
  minneapolis: { city: "Minneapolis", state: "MN", timezone: "America/Chicago" },
  milwaukee: { city: "Milwaukee", state: "WI", timezone: "America/Chicago" },
  huntsville: { city: "Huntsville", state: "AL", timezone: "America/Chicago" },
  richmond: { city: "Richmond", state: "VA", timezone: "America/New_York" },
  charleston: { city: "Charleston", state: "SC", timezone: "America/New_York" },
  omaha: { city: "Omaha", state: "NE", timezone: "America/Chicago" },
  "oklahoma-city": {
    city: "Oklahoma City",
    state: "OK",
    timezone: "America/Chicago",
  },
  birmingham: { city: "Birmingham", state: "AL", timezone: "America/Chicago" },
  greenville: { city: "Greenville", state: "SC", timezone: "America/New_York" },
  "des-moines": { city: "Des Moines", state: "IA", timezone: "America/Chicago" },
  seattle: { city: "Seattle", state: "WA", timezone: "America/Los_Angeles" },
  chicago: { city: "Chicago", state: "IL", timezone: "America/Chicago" },
  cincinnati: { city: "Cincinnati", state: "OH", timezone: "America/New_York" },
  tulsa: { city: "Tulsa", state: "OK", timezone: "America/Chicago" },
  detroit: { city: "Detroit", state: "MI", timezone: "America/Detroit" },
};

export function geoFromTags(tags) {
  const list = Array.isArray(tags) ? tags : [];
  for (const tag of list) {
    const geo = MARKET_GEO[tag];
    if (geo) return { slug: tag, ...geo };
  }
  return null;
}
