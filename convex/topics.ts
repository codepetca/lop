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

    // For standard polls, enrich with vote counts
    if (poll.pollType === "standard") {
      return await Promise.all(
        topics.map(async (topic) => {
          const votes = await ctx.db
            .query("votes")
            .withIndex("by_poll_topic", (q) =>
              q.eq("pollId", args.pollId).eq("topicId", topic._id)
            )
            .collect();

          return {
            ...topic,
            voteCount: votes.length,
            selectedBy: null, // Not used for standard polls
          };
        })
      );
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

    await validateAdminAccess(ctx, topic.pollId, args.adminToken);

    // If topic is claimed, delete the group as well
    if (topic.selectedByGroupId) {
      await ctx.db.delete(topic.selectedByGroupId);
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

// Clear all claims (admin only)
export const clearAllClaims = mutation({
  args: {
    pollId: v.id("polls"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await validateAdminAccess(ctx, args.pollId, args.adminToken);

    // Find all topics for this poll
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Clear claims from all topics
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
