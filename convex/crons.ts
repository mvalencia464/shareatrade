import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "enrich WA L&I licenses",
  { dayOfWeek: "sunday", hourUTC: 8, minuteUTC: 0 },
  internal.licenses.enrichWa,
  {},
);

// DataForSEO GBP rating/review refresh — leave off until the directory has traffic.
// Standard queue: post tasks, then collect ~1 hour later (results can take up to 45 min).
// Skip non-numeric googleCid (e.g. nicc:). Set DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD
// in Convex env first. DATAFORSEO_SANDBOX=1 uses dummy data at no cost.
//
// Monthly (default when you turn this on):
// crons.monthly(
//   "post GBP DataForSEO tasks",
//   { day: 1, hourUTC: 8, minuteUTC: 0 },
//   internal.gbpRefresh.postTasks,
//   {},
// );
// crons.monthly(
//   "collect GBP DataForSEO results",
//   { day: 1, hourUTC: 9, minuteUTC: 0 },
//   internal.gbpRefresh.collectReady,
//   {},
// );
//
// Weekly instead:
// crons.weekly(
//   "post GBP DataForSEO tasks",
//   { dayOfWeek: "sunday", hourUTC: 9, minuteUTC: 0 },
//   internal.gbpRefresh.postTasks,
//   {},
// );
// crons.weekly(
//   "collect GBP DataForSEO results",
//   { dayOfWeek: "sunday", hourUTC: 10, minuteUTC: 0 },
//   internal.gbpRefresh.collectReady,
//   {},
// );

export default crons;
