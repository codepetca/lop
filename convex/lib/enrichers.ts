/**
 * Data enrichment helpers for Convex queries
 */

import { GenericQueryCtx } from "convex/server";
import { DataModel, Doc } from "../_generated/dataModel";

type Ctx = GenericQueryCtx<DataModel>;

/**
 * Enrich topics with group/member information
 */
export async function enrichTopicsWithGroups(
  ctx: Ctx,
  topics: Doc<"topics">[]
) {
  return await Promise.all(
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
}
