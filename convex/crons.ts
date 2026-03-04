import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Delete expired polls daily at 2 AM UTC.
// Expiry is tier-based: POLL_MAX_AGE_DAYS_ANONYMOUS (default: 30 days) and POLL_MAX_AGE_DAYS_FREE (default: 180 days). Pro polls never expire.
crons.daily(
  "cleanup old polls",
  { hourUTC: 2, minuteUTC: 0 },
  internal.polls.cleanupOldPolls,
);

export default crons;
