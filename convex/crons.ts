import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "enrich WA L&I licenses",
  { dayOfWeek: "sunday", hourUTC: 8, minuteUTC: 0 },
  internal.licenses.enrichWa,
  {},
);

export default crons;
