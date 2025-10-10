import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { validateAdminAccess } from "./lib/validators";

// Generate a random admin token
function generateAdminToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Create a new poll
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    topicLabels: v.array(v.string()),
    membersPerGroup: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const adminToken = generateAdminToken();
    const membersPerGroup = args.membersPerGroup ?? 1;

    // Validate membersPerGroup is between 1 and 10
    if (membersPerGroup < 1 || membersPerGroup > 10) {
      throw new Error("Members per group must be between 1 and 10");
    }

    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      isOpen: true,
      resultsVisible: true,
      adminToken,
      membersPerGroup,
      createdAt: Date.now(),
    });

    // Create topics with order
    let order = 0;
    for (const label of args.topicLabels) {
      if (label.trim()) {
        await ctx.db.insert("topics", {
          pollId,
          label: label.trim(),
          order: order,
        });
        order++;
      }
    }

    return { pollId, adminToken };
  },
});

// Get poll by ID
export const get = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pollId);
  },
});

// Validate which polls exist from a list of IDs
export const validatePolls = query({
  args: { pollIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existingIds: string[] = [];

    for (const pollId of args.pollIds) {
      try {
        const poll = await ctx.db.get(pollId as Id<"polls">);
        if (poll) {
          existingIds.push(pollId);
        }
      } catch (e) {
        // Invalid ID format or poll doesn't exist, skip it
        continue;
      }
    }

    return existingIds;
  },
});

// Toggle poll open/closed (admin only)
export const toggleOpen = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await validateAdminAccess(ctx, args.pollId, args.adminToken);

    await ctx.db.patch(args.pollId, {
      isOpen: !poll.isOpen,
    });

    return { isOpen: !poll.isOpen };
  },
});

// Toggle results visibility (admin only)
export const toggleResultsVisible = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await validateAdminAccess(ctx, args.pollId, args.adminToken);

    const newValue = !(poll.resultsVisible ?? true);
    await ctx.db.patch(args.pollId, {
      resultsVisible: newValue,
    });

    return { resultsVisible: newValue };
  },
});

// Update poll title and description (admin only)
export const updatePollDetails = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    const updates: { title?: string; description?: string } = {};

    if (args.title !== undefined) {
      if (args.title.trim() === "") {
        throw new Error("Title cannot be empty");
      }
      updates.title = args.title.trim();
    }

    if (args.description !== undefined) {
      updates.description = args.description.trim() || undefined;
    }

    await ctx.db.patch(args.pollId, updates);

    return { success: true };
  },
});

// Add topics to poll (admin only)
export const addTopics = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
    topicLabels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    // Get current max order
    const existingTopics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    let maxOrder = existingTopics.length > 0
      ? Math.max(...existingTopics.map(t => t.order))
      : -1;

    const added: Id<"topics">[] = [];
    for (const label of args.topicLabels) {
      if (label.trim()) {
        maxOrder++;
        const topicId = await ctx.db.insert("topics", {
          pollId: args.pollId,
          label: label.trim(),
          order: maxOrder,
        });
        added.push(topicId);
      }
    }

    return { added };
  },
});

// Export results as CSV data
export const exportResults = query({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const results = [];
    for (const topic of topics) {
      if (topic.selectedByGroupId) {
        const group = await ctx.db.get(topic.selectedByGroupId);
        if (group) {
          // Create a row for the group
          const memberNames = group.members
            .map((m) => `${m.firstName} ${m.lastName}`)
            .join("; ");

          results.push({
            topic: topic.label,
            members: memberNames,
            selectedAt: new Date(topic.selectedAt || 0).toISOString(),
          });
        }
      } else {
        results.push({
          topic: topic.label,
          members: "",
          selectedAt: "",
        });
      }
    }

    return results;
  },
});

// Delete a poll and all associated data (admin only)
export const deletePoll = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    // Delete all topics for this poll
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const topic of topics) {
      await ctx.db.delete(topic._id);
    }

    // Delete all groups for this poll
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const group of groups) {
      await ctx.db.delete(group._id);
    }

    // Delete the poll itself
    await ctx.db.delete(args.pollId);

    return { success: true };
  },
});
