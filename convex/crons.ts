import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Delete polls older than POLL_MAX_AGE_DAYS (default: 180) every day at 2 AM UTC
crons.daily(
  "cleanup old polls",
  { hourUTC: 2, minuteUTC: 0 },
  internal.polls.cleanupOldPolls,
);

export default crons;
