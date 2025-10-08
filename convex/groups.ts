import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    if (!poll.isOpen) throw new Error("Poll is closed");

    // Validate member count matches poll requirement
    const requiredMembers = poll.membersPerGroup ?? 1;
    if (args.members.length !== requiredMembers) {
      throw new Error(
        `This poll requires exactly ${requiredMembers} member${
          requiredMembers > 1 ? "s" : ""
        }`
      );
    }

    // Validate all members have first and last names
    for (const member of args.members) {
      if (!member.firstName.trim() || !member.lastName.trim()) {
        throw new Error("All members must have first and last names");
      }
    }

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
    if (!poll.isOpen) throw new Error("Poll is closed");

    // Validate member count
    const requiredMembers = poll.membersPerGroup ?? 1;
    if (args.members.length !== requiredMembers) {
      throw new Error(
        `This poll requires exactly ${requiredMembers} member${
          requiredMembers > 1 ? "s" : ""
        }`
      );
    }

    // Validate all members have names
    for (const member of args.members) {
      if (!member.firstName.trim() || !member.lastName.trim()) {
        throw new Error("All members must have first and last names");
      }
    }

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

    const poll = await ctx.db.get(group.pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.adminToken !== args.adminToken) {
      throw new Error("Invalid admin token");
    }

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
