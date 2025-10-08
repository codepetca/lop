import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  polls: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    isOpen: v.boolean(),
    adminToken: v.string(),
    membersPerGroup: v.optional(v.number()), // 1-10, how many members required per group (defaults to 1)
    createdAt: v.number(), // Date.now()
  }),
  topics: defineTable({
    pollId: v.id("polls"),
    label: v.string(),
    order: v.number(), // Display order (0-based)
    selectedByGroupId: v.optional(v.id("groups")),
    selectedAt: v.optional(v.number()),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_order", ["pollId", "order"])
    .index("by_poll_label", ["pollId", "label"]),
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
});
