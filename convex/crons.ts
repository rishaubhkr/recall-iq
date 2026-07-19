import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "compute-daily-memory-snapshots",
  { hourUTC: 21, minuteUTC: 30 }, // 3:00 AM IST / 21:30 UTC
  internal.snapshots.computeDailySnapshots,
);

crons.weekly(
  "weekly-leagues-reset",
  { dayOfWeek: "sunday", hourUTC: 23, minuteUTC: 59 },
  api.leagues.processWeeklyLeagues,
);

export default crons;
