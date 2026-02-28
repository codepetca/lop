import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateAdminAccess } from "./lib/validators";
import { enrichTopicsWithGroups } from "./lib/enrichers";

// Get all topics for a poll with their selection status
export const list = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return [];

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Sort by order
    topics.sort((a, b) => a.order - b.order);

    const requireNames = poll.requireParticipantNames ?? true;

    // For standard polls, enrich with vote counts (single query, no N+1)
    if (poll.pollType === "standard") {
      const allVotes = await ctx.db
        .query("votes")
        .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
        .collect();

      const voteCountByTopic = new Map<string, number>();
      for (const vote of allVotes) {
        voteCountByTopic.set(
          vote.topicId,
          (voteCountByTopic.get(vote.topicId) ?? 0) + 1
        );
      }

      return topics.map((topic) => ({
        ...topic,
        voteCount: voteCountByTopic.get(topic._id) ?? 0,
        selectedBy: null, // Not used for standard polls
      }));
    }

    // For claims polls, enrich with group information (or hide if anonymous)
    if (!requireNames) {
      return topics.map((topic) => ({
        ...topic,
        selectedBy: null, // Hide names for anonymous polls
      }));
    }

    return await enrichTopicsWithGroups(ctx, topics);
  },
});

// Reorder topics (admin only)
export const reorderTopics = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
    topicIds: v.array(v.id("topics")),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    // Update the order for each topic
    for (let i = 0; i < args.topicIds.length; i++) {
      const topicId = args.topicIds[i];
      const topic = await ctx.db.get(topicId);

      if (topic && topic.pollId === args.pollId) {
        await ctx.db.patch(topicId, { order: i });
      }
    }

    return { success: true };
  },
});

// Delete a topic (admin only)
export const deleteTopic = mutation({
  args: {
    topicId: v.id("topics"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    const poll = await validateAdminAccess(ctx, topic.pollId, args.adminToken);

    if (poll.pollType === "standard") {
      // Delete all votes for this topic
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_poll_topic", (q) =>
          q.eq("pollId", topic.pollId).eq("topicId", args.topicId)
        )
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
    } else {
      // Claims poll: if topic is claimed, delete the claiming group
      if (topic.selectedByGroupId) {
        await ctx.db.delete(topic.selectedByGroupId);
      }
    }

    // Delete the topic
    await ctx.db.delete(args.topicId);
    return { success: true };
  },
});

// Unclaim a specific topic (admin only)
export const unclaimTopic = mutation({
  args: {
    topicId: v.id("topics"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    await validateAdminAccess(ctx, topic.pollId, args.adminToken);

    // Clear the claim
    if (topic.selectedByGroupId) {
      await ctx.db.patch(args.topicId, {
        selectedByGroupId: undefined,
        selectedAt: undefined,
      });
    }

    return { success: true };
  },
});

// Rename a topic (admin only)
export const renameTopic = mutation({
  args: {
    topicId: v.id("topics"),
    adminToken: v.string(),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    await validateAdminAccess(ctx, topic.pollId, args.adminToken);

    // Validate label is not empty
    const trimmedLabel = args.label.trim();
    if (!trimmedLabel) {
      throw new Error("Topic label cannot be empty");
    }

    // Reject duplicate labels within the same poll (by_poll_label index invariant)
    const duplicate = await ctx.db
      .query("topics")
      .withIndex("by_poll_label", (q) =>
        q.eq("pollId", topic.pollId).eq("label", trimmedLabel)
      )
      .first();
    if (duplicate && duplicate._id !== args.topicId) {
      throw new Error("A topic with that label already exists in this poll");
    }

    // Update the topic label
    await ctx.db.patch(args.topicId, {
      label: trimmedLabel,
    });

    return { success: true };
  },
});

// Clear all claims/votes (admin only)
export const clearAllClaims = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await validateAdminAccess(ctx, args.pollId, args.adminToken);

    if (poll.pollType === "standard") {
      // For standard polls, delete all votes
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      return { success: true, clearedCount: votes.length };
    }

    // For claims polls, clear selectedByGroupId from all topics
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    let clearedCount = 0;
    for (const topic of topics) {
      if (topic.selectedByGroupId) {
        await ctx.db.patch(topic._id, {
          selectedByGroupId: undefined,
          selectedAt: undefined,
        });
        clearedCount++;
      }
    }

    return { success: true, clearedCount };
  },
});
