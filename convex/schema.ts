import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Extend the users table with a tier field
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Subscription tier: anonymous (default) | free (signed in) | pro (manually set)
    tier: v.optional(v.union(v.literal("anonymous"), v.literal("free"), v.literal("pro"))),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  polls: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    isOpen: v.boolean(),
    resultsVisible: v.optional(v.boolean()),
    topicsVisible: v.optional(v.boolean()), // Whether topics are visible to students when poll is closed (defaults to false)
    adminToken: v.string(),
    membersPerGroup: v.optional(v.number()),
    pollType: v.optional(v.union(v.literal("claims"), v.literal("standard"))),
    requireParticipantNames: v.optional(v.boolean()),
    createdAt: v.number(),
    // Auth fields (new)
    userId: v.optional(v.id("users")),
    // Legacy rate-limiting field (deprecated, kept for backwards compat)
    creatorDeviceId: v.optional(v.string()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_creator_createdAt", ["creatorDeviceId", "createdAt"]),
  topics: defineTable({
    pollId: v.id("polls"),
    label: v.string(),
    order: v.number(),
    selectedByGroupId: v.optional(v.id("groups")),
    selectedAt: v.optional(v.number()),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_order", ["pollId", "order"])
    .index("by_poll_label", ["pollId", "label"])
    .index("by_poll_group", ["pollId", "selectedByGroupId"]),

  groups: defineTable({
    pollId: v.id("polls"),
    members: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_poll", ["pollId"]),

  votes: defineTable({
    pollId: v.id("polls"),
    topicId: v.id("topics"),
    groupId: v.id("groups"),
    votedAt: v.number(),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_topic", ["pollId", "topicId"])
    .index("by_poll_group", ["pollId", "groupId"]),
});
