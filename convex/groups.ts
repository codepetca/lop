import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateAdminAccess, validatePollOpen, validateMembers } from "./lib/validators";

// Find or create a group for a poll
export const findOrCreate = mutation({
  args: {
    pollId: v.id("polls"),
    members: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if poll exists and is open
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    validatePollOpen(poll);

    const requiredMembers = poll.membersPerGroup ?? 1;
    const requireNames = poll.requireParticipantNames ?? true;
    validateMembers(args.members, requiredMembers, requireNames);

    // Always create a new group (no lookup by name)
    const groupId = await ctx.db.insert("groups", {
      pollId: args.pollId,
      members: args.members,
      createdAt: Date.now(),
    });

    return groupId;
  },
});

// Update existing group members
export const update = mutation({
  args: {
    groupId: v.id("groups"),
    members: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const poll = await ctx.db.get(group.pollId);
    if (!poll) throw new Error("Poll not found");

    validatePollOpen(poll);

    const requiredMembers = poll.membersPerGroup ?? 1;
    const requireNames = poll.requireParticipantNames ?? true;
    validateMembers(args.members, requiredMembers, requireNames);

    await ctx.db.patch(args.groupId, { members: args.members });
    return args.groupId;
  },
});

// Delete a group and its topic selection
export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await validateAdminAccess(ctx, group.pollId, args.adminToken);

    // Find and unclaim any topic this group selected
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", group.pollId))
      .collect();

    const selectedTopic = topics.find((t) => t.selectedByGroupId === args.groupId);
    if (selectedTopic) {
      await ctx.db.patch(selectedTopic._id, {
        selectedByGroupId: undefined,
        selectedAt: undefined,
      });
    }

    // Delete the group
    await ctx.db.delete(args.groupId);
    return { success: true };
  },
});

// Get all groups for a poll
export const list = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
  },
});

// Self-delete a group (student-initiated restart)
export const selfDelete = mutation({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Verify group belongs to this poll
    if (group.pollId !== args.pollId) {
      throw new Error("Group does not belong to this poll");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    validatePollOpen(poll);

    // Remove any selections based on poll type
    if (poll.pollType === "standard") {
      // For standard polls, delete any votes by this group
      const vote = await ctx.db
        .query("votes")
        .withIndex("by_poll_group", (q) =>
          q.eq("pollId", args.pollId).eq("groupId", args.groupId)
        )
        .first();

      if (vote) {
        await ctx.db.delete(vote._id);
      }
    } else {
      // For claims polls, unclaim any topic selected by this group
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
        .collect();

      const selectedTopic = topics.find((t) => t.selectedByGroupId === args.groupId);
      if (selectedTopic) {
        await ctx.db.patch(selectedTopic._id, {
          selectedByGroupId: undefined,
          selectedAt: undefined,
        });
      }
    }

    // Delete the group
    await ctx.db.delete(args.groupId);
    return { success: true };
  },
});
