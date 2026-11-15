import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * The safety net cannot depend on a browser being open. This sweep advances
 * every open escalation whose grace window has expired, so stage 2 and stage 3
 * fire even if the guardian is asleep or offline.
 */
crons.interval(
  "advance due escalations",
  { minutes: 2 },
  internal.escalations.processDue,
  {},
);

export default crons;
