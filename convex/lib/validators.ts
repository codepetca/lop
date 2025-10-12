/**
 * Shared validation helpers for Convex mutations
 */

import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { Id } from "../_generated/dataModel";
import { DataModel } from "../_generated/dataModel";

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

/**
 * Validate admin access to a poll
 * @throws Error if poll not found or token invalid
 */
export async function validateAdminAccess(
  ctx: Ctx,
  pollId: Id<"polls">,
  adminToken: string
) {
  const poll = await ctx.db.get(pollId);
  if (!poll) {
    throw new Error("Poll not found");
  }
  if (poll.adminToken !== adminToken) {
    throw new Error("Invalid admin token");
  }
  return poll;
}

/**
 * Validate that a poll is open for participation
 * @throws Error if poll is closed
 */
export function validatePollOpen(poll: { isOpen: boolean }) {
  if (!poll.isOpen) {
    throw new Error("Poll is closed");
  }
}

/**
 * Validate member data
 * @throws Error if validation fails
 */
export function validateMembers(
  members: Array<{ firstName: string; lastName: string }>,
  requiredCount: number,
  requireNames = true
) {
  // If names not required, allow empty names
  if (!requireNames) {
    return; // Skip validation
  }

  if (members.length !== requiredCount) {
    throw new Error(
      `This poll requires exactly ${requiredCount} member${
        requiredCount > 1 ? "s" : ""
      }`
    );
  }

  for (const member of members) {
    if (!member.firstName.trim() || !member.lastName.trim()) {
      throw new Error("All members must have first and last names");
    }
  }
}
