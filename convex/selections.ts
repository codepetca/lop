import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validatePollOpen } from "./lib/validators";

// Get current vote for a group (for standard polls)
export const getCurrentVote = query({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_poll_group", (q) =>
        q.eq("pollId", args.pollId).eq("groupId", args.groupId)
      )
      .first();

    return vote ? vote.topicId : null;
  },
});

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

    validatePollOpen(poll);

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

    validatePollOpen(poll);

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

// Vote for a topic (for standard polls - allows multiple groups)
export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    // 1. Validate poll is open
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    validatePollOpen(poll);

    // 2. Verify this is a standard poll
    if (poll.pollType !== "standard") {
      throw new Error("This poll does not support voting");
    }

    // 3. Verify topic belongs to this poll
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");
    if (topic.pollId !== args.pollId) throw new Error("Topic not in poll");

    // 4. Check if group already voted for this topic
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_poll_group", (q) =>
        q.eq("pollId", args.pollId).eq("groupId", args.groupId)
      )
      .first();

    // 5. If group already voted for a different topic, remove old vote
    if (existingVote && existingVote.topicId !== args.topicId) {
      await ctx.db.delete(existingVote._id);
    }

    // 6. If already voted for this topic, do nothing
    if (existingVote && existingVote.topicId === args.topicId) {
      return { success: true, alreadyVoted: true };
    }

    // 7. Create the vote
    await ctx.db.insert("votes", {
      pollId: args.pollId,
      topicId: args.topicId,
      groupId: args.groupId,
      votedAt: Date.now(),
    });

    return { success: true, alreadyVoted: false };
  },
});

// Remove vote (for standard polls)
export const unvote = mutation({
  args: {
    pollId: v.id("polls"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Validate poll is open
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    validatePollOpen(poll);

    // Find the vote by this group
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_poll_group", (q) =>
        q.eq("pollId", args.pollId).eq("groupId", args.groupId)
      )
      .first();

    if (existingVote) {
      await ctx.db.delete(existingVote._id);
    }

    return { success: true };
  },
});

