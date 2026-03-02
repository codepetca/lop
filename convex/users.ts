import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current authenticated user (only the fields the client needs)
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      name: user.name,
      image: user.image,
      email: user.email,
      isAnonymous: user.isAnonymous,
      tier: user.tier,
    };
  },
});

// Manually set a user's tier (run from Convex dashboard)
export const setTier = internalMutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("anonymous"), v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { tier: args.tier });
    return { success: true };
  },
});
