import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all topics for a poll with their selection status
export const list = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Sort by order
    topics.sort((a, b) => a.order - b.order);

    // Enrich with group information
    const enriched = await Promise.all(
      topics.map(async (topic) => {
        if (topic.selectedByGroupId) {
          const group = await ctx.db.get(topic.selectedByGroupId);
          return {
            ...topic,
            selectedBy: group ? group.members : null,
          };
        }
        return { ...topic, selectedBy: null };
      })
    );

    return enriched;
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
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.adminToken !== args.adminToken) {
      throw new Error("Invalid admin token");
    }

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

    const poll = await ctx.db.get(topic.pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.adminToken !== args.adminToken) {
      throw new Error("Invalid admin token");
    }

    // If topic is claimed, delete the group as well
    if (topic.selectedByGroupId) {
      await ctx.db.delete(topic.selectedByGroupId);
    }

    // Delete the topic
    await ctx.db.delete(args.topicId);
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
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.adminToken !== args.adminToken) {
      throw new Error("Invalid admin token");
    }

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
