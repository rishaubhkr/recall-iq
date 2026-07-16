import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "compute-daily-memory-snapshots",
  { hourUTC: 21, minuteUTC: 30 }, // 3:00 AM IST / 21:30 UTC
  internal.snapshots.computeDailySnapshots,
);

export default crons;
