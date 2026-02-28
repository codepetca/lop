import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createClaimsPoll(t: ReturnType<typeof convexTest>) {
  return t.mutation(api.polls.create, {
    title: "Test Poll",
    topicLabels: ["Topic A", "Topic B"],
    pollType: "claims",
  });
}

async function createStandardPoll(t: ReturnType<typeof convexTest>) {
  return t.mutation(api.polls.create, {
    title: "Test Poll",
    topicLabels: ["Topic A", "Topic B"],
    pollType: "standard",
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
// claim
// ---------------------------------------------------------------------------

describe("claim (claims poll)", () => {
  test("first group to claim a topic wins", async () => {
    const t = convexTest(schema);
    const { pollId } = await createClaimsPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    const result = await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topics[0]._id,
    });

    expect(result.success).toBe(true);
    expect(result.alreadySelected).toBe(false);

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    expect((updated[0] as any).selectedByGroupId).toBe(groupId);
  });

  test("second group cannot claim a topic already claimed by another group", async () => {
    const t = convexTest(schema);
    const { pollId } = await createClaimsPoll(t);
    const [group1, group2] = await Promise.all([
      createGroup(t, pollId, "Alice"),
      createGroup(t, pollId, "Bob"),
    ]);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: group1 as any,
      topicId,
    });

    await expect(
      t.mutation(api.selections.claim, {
        pollId: pollId as any,
        groupId: group2 as any,
        topicId,
      })
    ).rejects.toThrow("Topic already claimed");
  });

  test("re-claiming own topic is a no-op and does not change selectedByGroupId", async () => {
    const t = convexTest(schema);
    const { pollId } = await createClaimsPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });
    const result = await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });

    expect(result.alreadySelected).toBe(true);
    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    expect((updated[0] as any).selectedByGroupId).toBe(groupId);
  });

  test("claiming a second topic automatically releases the first", async () => {
    const t = convexTest(schema);
    const { pollId } = await createClaimsPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const [topicA, topicB] = topics;

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topicA._id,
    });
    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topicB._id,
    });

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    const updA = updated.find((t) => t._id === topicA._id)!;
    const updB = updated.find((t) => t._id === topicB._id)!;

    expect((updA as any).selectedByGroupId).toBeUndefined();
    expect((updB as any).selectedByGroupId).toBe(groupId);
  });

  test("claim fails when poll is closed", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createClaimsPoll(t);
    const groupId = await createGroup(t, pollId);
    await t.mutation(api.polls.toggleOpen, {
      pollId: pollId as any,
      adminToken,
    });
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await expect(
      t.mutation(api.selections.claim, {
        pollId: pollId as any,
        groupId: groupId as any,
        topicId: topics[0]._id,
      })
    ).rejects.toThrow("Poll is closed");
  });
});

// ---------------------------------------------------------------------------
// unclaim
// ---------------------------------------------------------------------------

describe("unclaim (claims poll)", () => {
  test("clears the group's topic selection", async () => {
    const t = convexTest(schema);
    const { pollId } = await createClaimsPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topics[0]._id,
    });
    await t.mutation(api.selections.unclaim, {
      pollId: pollId as any,
      groupId: groupId as any,
    });

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    expect((updated[0] as any).selectedByGroupId).toBeUndefined();
    expect(updated[0].selectedBy).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// vote / unvote (standard poll)
// ---------------------------------------------------------------------------

describe("vote (standard poll)", () => {
  test("records a vote for a topic", async () => {
    const t = convexTest(schema);
    const { pollId } = await createStandardPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    const result = await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });

    expect(result.success).toBe(true);
    expect(result.alreadyVoted).toBe(false);

    const currentVote = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(currentVote).toBe(topicId);
  });

  test("switching vote removes old and casts new", async () => {
    const t = convexTest(schema);
    const { pollId } = await createStandardPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const [topicA, topicB] = topics;

    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topicA._id,
    });
    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topicB._id,
    });

    const currentVote = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(currentVote).toBe(topicB._id);

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    const updA = updated.find((t) => t._id === topicA._id)!;
    const updB = updated.find((t) => t._id === topicB._id)!;
    expect((updA as any).voteCount).toBe(0);
    expect((updB as any).voteCount).toBe(1);
  });

  test("re-voting same topic is a no-op and does not double-count", async () => {
    const t = convexTest(schema);
    const { pollId } = await createStandardPoll(t);
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });
    const result = await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId,
    });

    expect(result.alreadyVoted).toBe(true);
    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    expect((updated[0] as any).voteCount).toBe(1);
  });

  test("multiple groups can vote for the same topic", async () => {
    const t = convexTest(schema);
    const { pollId } = await createStandardPoll(t);
    const [g1, g2, g3] = await Promise.all([
      createGroup(t, pollId, "Alice"),
      createGroup(t, pollId, "Bob"),
      createGroup(t, pollId, "Carol"),
    ]);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicId = topics[0]._id;

    for (const g of [g1, g2, g3]) {
      await t.mutation(api.selections.vote, {
        pollId: pollId as any,
        groupId: g as any,
        topicId,
      });
    }

    const updated = await t.query(api.topics.list, { pollId: pollId as any });
    expect((updated[0] as any).voteCount).toBe(3);
  });
});
