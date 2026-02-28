import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createPoll(
  t: ReturnType<typeof convexTest>,
  opts: { pollType?: "claims" | "standard"; topicLabels?: string[] } = {}
) {
  return t.mutation(api.polls.create, {
    title: "Test Poll",
    topicLabels: opts.topicLabels ?? ["Topic A", "Topic B"],
    pollType: opts.pollType ?? "claims",
  });
}

async function createGroup(
  t: ReturnType<typeof convexTest>,
  pollId: string,
  firstName = "Alice"
) {
  return t.mutation(api.groups.createGroup, {
    pollId: pollId as any,
    members: [{ firstName, lastName: "Test" }],
  });
}

// ---------------------------------------------------------------------------
// clearAllClaims
// ---------------------------------------------------------------------------

describe("clearAllClaims", () => {
  test("clears selectedByGroupId from all topics in a claims poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      topicLabels: ["Topic A", "Topic B"],
    });
    const [g1, g2] = await Promise.all([
      createGroup(t, pollId, "Alice"),
      createGroup(t, pollId, "Bob"),
    ]);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: g1 as any,
      topicId: topics[0]._id,
    });
    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: g2 as any,
      topicId: topics[1]._id,
    });

    const { clearedCount } = await t.mutation(api.topics.clearAllClaims, {
      pollId: pollId as any,
      adminToken,
    });

    expect(clearedCount).toBe(2);

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    for (const topic of updated) {
      expect((topic as any).selectedByGroupId).toBeUndefined();
      expect(topic.selectedBy).toBeNull();
    }

    // Groups themselves should still exist
    const groups = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groups).toHaveLength(2);
  });

  test("deletes all vote rows for a standard poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      pollType: "standard",
      topicLabels: ["Topic A"],
    });
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });

    // Vote exists before clear
    const voteBefore = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(voteBefore).toBe(topicId);

    const { clearedCount } = await t.mutation(api.topics.clearAllClaims, {
      pollId: pollId as any,
      adminToken,
    });

    expect(clearedCount).toBe(1);

    // Vote gone — this was the bug
    const voteAfter = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(voteAfter).toBeNull();

    // Group still exists; only the vote row was removed
    const groups = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groups).toHaveLength(1);
  });

  test("returns clearedCount of 0 when nothing is claimed", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t);

    const { clearedCount } = await t.mutation(api.topics.clearAllClaims, {
      pollId: pollId as any,
      adminToken,
    });

    expect(clearedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deleteTopic
// ---------------------------------------------------------------------------

describe("deleteTopic", () => {
  test("deletes the claiming group when a claims-poll topic is deleted", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      topicLabels: ["Topic A", "Topic B"],
    });
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topics[0]._id,
    });

    await t.mutation(api.topics.deleteTopic, {
      topicId: topics[0]._id,
      adminToken,
    });

    const topicsAfter = await t.query(api.topics.list, { pollId: pollId as any });
    expect(topicsAfter).toHaveLength(1); // Only Topic B remains
    expect(topicsAfter[0].label).toBe("Topic B");

    // Claiming group should be deleted
    const groups = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groups).toHaveLength(0);
  });

  test("deletes associated vote rows when a standard-poll topic is deleted", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      pollType: "standard",
      topicLabels: ["Topic A"],
    });
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });

    await t.mutation(api.topics.deleteTopic, {
      topicId,
      adminToken,
    });

    const topicsAfter = await t.query(api.topics.list, { pollId: pollId as any });
    expect(topicsAfter).toHaveLength(0);

    // Vote row should be gone — this was the bug
    const voteAfter = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(voteAfter).toBeNull();

    // Group should still exist
    const groups = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groups).toHaveLength(1);
  });

  test("deleting an unclaimed topic leaves other topics intact", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      topicLabels: ["Topic A", "Topic B", "Topic C"],
    });
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.topics.deleteTopic, {
      topicId: topics[1]._id, // delete Topic B
      adminToken,
    });

    const remaining = await t.query(api.topics.list, { pollId: pollId as any });
    expect(remaining).toHaveLength(2);
    expect(remaining.map((t) => t.label)).toEqual(
      expect.arrayContaining(["Topic A", "Topic C"])
    );
  });
});
