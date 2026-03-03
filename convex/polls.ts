import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { validateAdminAccess } from "./lib/validators";
import { getAuthUserId } from "@convex-dev/auth/server";

// Tier poll limits
const TIER_POLL_LIMITS = {
  anonymous: 2,
  free: 5,
  pro: 10,
} as const;

type Tier = keyof typeof TIER_POLL_LIMITS;

// Max topics per poll (module-level so it's parsed once)
const MAX_TOPICS_PER_POLL = parseInt(process.env.MAX_TOPICS_PER_POLL ?? "") || 100;

// Resolve a user document to their effective Tier
function resolveTier(user: { tier?: string | null; isAnonymous?: boolean | null } | null): Tier {
  if (!user) return "anonymous";
  const isAnonymous = user.isAnonymous === true;
  return (user.tier as Tier) ?? (isAnonymous ? "anonymous" : "free");
}

// Generate a cryptographically secure admin token
function generateAdminToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

// Create a new poll
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    topicLabels: v.array(v.string()),
    membersPerGroup: v.optional(v.number()),
    pollType: v.optional(v.union(v.literal("claims"), v.literal("standard"))),
    requireParticipantNames: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const adminToken = generateAdminToken();
    const membersPerGroup = args.membersPerGroup ?? 1;
    const pollType = args.pollType ?? "claims";
    const requireParticipantNames = args.requireParticipantNames ?? true;

    if (membersPerGroup < 1 || membersPerGroup > 10) {
      throw new Error("Members per group must be between 1 and 10");
    }

    // Validate topic count
    const validTopics = args.topicLabels.filter((l) => l.trim());
    if (validTopics.length > MAX_TOPICS_PER_POLL) {
      throw new Error(`Too many topics (max ${MAX_TOPICS_PER_POLL} per poll).`);
    }

    // Get authenticated user and their tier
    const userId = await getAuthUserId(ctx);
    let tier: Tier = "anonymous";
    if (userId) {
      const user = await ctx.db.get(userId);
      tier = resolveTier(user);
    }

    // Enforce tier-based poll limit
    const pollLimit = TIER_POLL_LIMITS[tier];
    if (userId) {
      const userPolls = await ctx.db
        .query("polls")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(pollLimit + 1);
      if (userPolls.length >= pollLimit) {
        if (tier === "anonymous") {
          throw new Error(
            `Anonymous users can create up to ${pollLimit} polls. Sign up for a free account to create more.`
          );
        } else if (tier === "free") {
          throw new Error(
            `Free accounts can create up to ${pollLimit} polls. Upgrade to Pro for more.`
          );
        } else {
          throw new Error(`Poll limit reached (max ${pollLimit}).`);
        }
      }
    }

    // Global total cap (DB size backstop)
    const maxTotalPolls = parseInt(process.env.MAX_TOTAL_POLLS ?? "") || 500;
    const existingPolls = await ctx.db.query("polls").take(maxTotalPolls + 1);
    if (existingPolls.length > maxTotalPolls) {
      throw new Error(
        `Service poll limit reached. Please try again later.`
      );
    }

    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      isOpen: true,
      resultsVisible: true,
      adminToken,
      membersPerGroup,
      pollType,
      requireParticipantNames,
      createdAt: Date.now(),
      userId: userId ?? undefined,
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

// Get the current user's polls (server-side My Polls)
export const myPolls = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const polls = await ctx.db
      .query("polls")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return polls.map((p) => ({
      pollId: p._id,
      title: p.title,
      isOpen: p.isOpen,
      createdAt: p.createdAt,
      adminToken: p.adminToken,
    }));
  },
});

// Get the current user's poll count and limit
export const myPollUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { used: 0, limit: TIER_POLL_LIMITS.anonymous, tier: "anonymous" as Tier };

    const user = await ctx.db.get(userId);
    const tier = resolveTier(user);
    const limit = TIER_POLL_LIMITS[tier];

    const polls = await ctx.db
      .query("polls")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(limit + 1);

    return { used: polls.length, limit, tier };
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
    await ctx.db.patch(args.pollId, { isOpen: !poll.isOpen });
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
    await ctx.db.patch(args.pollId, { resultsVisible: newValue });
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
      if (args.title.trim() === "") throw new Error("Title cannot be empty");
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

    const existingTopics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const incomingCount = args.topicLabels.filter((l) => l.trim()).length;
    if (existingTopics.length + incomingCount > MAX_TOPICS_PER_POLL) {
      throw new Error(`Topic limit reached (max ${MAX_TOPICS_PER_POLL} per poll).`);
    }

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
    const poll = await validateAdminAccess(ctx, args.pollId, args.adminToken);

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    topics.sort((a, b) => a.order - b.order);

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
        topic: topic.label,
        members: "",
        selectedAt: "",
        votes: voteCountByTopic.get(topic._id) ?? 0,
      }));
    }

    const results = [];
    for (const topic of topics) {
      if (topic.selectedByGroupId) {
        const group = await ctx.db.get(topic.selectedByGroupId);
        if (group) {
          const memberNames = group.members
            .map((m) => `${m.firstName} ${m.lastName}`)
            .join("; ");
          results.push({
            topic: topic.label,
            members: memberNames,
            selectedAt: new Date(topic.selectedAt || 0).toISOString(),
            votes: null,
          });
        }
      } else {
        results.push({ topic: topic.label, members: "", selectedAt: "", votes: null });
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

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
    for (const topic of topics) await ctx.db.delete(topic._id);

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
    for (const group of groups) await ctx.db.delete(group._id);

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);

    await ctx.db.delete(args.pollId);
    return { success: true };
  },
});

// Auto-cleanup: delete polls based on owner's tier expiry rules
export const cleanupOldPolls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const maxAnonDays = parseInt(process.env.POLL_MAX_AGE_DAYS_ANONYMOUS ?? "") || 30;
    const maxFreeDays = parseInt(process.env.POLL_MAX_AGE_DAYS_FREE ?? "") || 180;

    const now = Date.now();
    const anonCutoff = now - maxAnonDays * 24 * 60 * 60 * 1000;
    const freeCutoff = now - maxFreeDays * 24 * 60 * 60 * 1000;

    // Fetch all polls older than the anonymous cutoff (the shorter window).
    // Pro polls are skipped inside the loop; free polls are only deleted if older than freeCutoff.
    const candidates = await ctx.db
      .query("polls")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", anonCutoff))
      .collect();

    const toDelete = new Set<Id<"polls">>();

    for (const poll of candidates) {
      const owner = poll.userId ? await ctx.db.get(poll.userId) : null;
      const tier = resolveTier(owner);

      if (tier === "pro") continue; // pro polls never expire
      if (tier === "free" && poll.createdAt >= freeCutoff) continue; // free poll not old enough
      toDelete.add(poll._id);
    }

    let deleted = 0;
    for (const pollId of toDelete) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_poll", (q) => q.eq("pollId", pollId))
        .collect();
      for (const topic of topics) await ctx.db.delete(topic._id);

      const groups = await ctx.db
        .query("groups")
        .withIndex("by_poll", (q) => q.eq("pollId", pollId))
        .collect();
      for (const group of groups) await ctx.db.delete(group._id);

      const votes = await ctx.db
        .query("votes")
        .withIndex("by_poll", (q) => q.eq("pollId", pollId))
        .collect();
      for (const vote of votes) await ctx.db.delete(vote._id);

      await ctx.db.delete(pollId);
      deleted++;
    }

    return { deleted };
  },
});
