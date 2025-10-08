import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Claim a topic (atomic operation)
export const claim = mutation({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    // 1. Validate poll is open
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    if (!poll.isOpen) throw new Error("Poll is closed");

    // 2. Check if group has a previous pick and unassign it
    const allTopics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const previousPick = allTopics.find(
      (t) => t.selectedByGroupId === args.groupId
    );

    if (previousPick && previousPick._id !== args.topicId) {
      await ctx.db.patch(previousPick._id, {
        selectedByGroupId: undefined,
        selectedAt: undefined,
      });
    }

    // 3. Load target topic and verify it's available
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");
    if (topic.pollId !== args.pollId) throw new Error("Topic not in poll");

    // If already selected by this group, do nothing
    if (topic.selectedByGroupId === args.groupId) {
      return { success: true, alreadySelected: true };
    }

    // If selected by another group, throw error
    if (topic.selectedByGroupId && topic.selectedByGroupId !== args.groupId) {
      throw new Error("Topic already claimed");
    }

    // 4. Claim the topic
    await ctx.db.patch(args.topicId, {
      selectedByGroupId: args.groupId,
      selectedAt: Date.now(),
    });

    return { success: true, alreadySelected: false };
  },
});

// Unclaim a topic
export const unclaim = mutation({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Validate poll is open
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    if (!poll.isOpen) throw new Error("Poll is closed");

    // Find the topic claimed by this group
    const allTopics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const claimedTopic = allTopics.find(
      (t) => t.selectedByGroupId === args.groupId
    );

    if (claimedTopic) {
      await ctx.db.patch(claimedTopic._id, {
        selectedByGroupId: undefined,
        selectedAt: undefined,
      });
    }

    return { success: true };
  },
});

// Get the current selection for a group
export const getCurrentSelection = query({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const selected = topics.find((t) => t.selectedByGroupId === args.groupId);
    return selected || null;
  },
});
