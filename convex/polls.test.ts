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
// deletePoll
// ---------------------------------------------------------------------------

describe("deletePoll", () => {
  test("removes all topics, groups, and votes for a standard poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      pollType: "standard",
      topicLabels: ["Topic A"],
    });
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topics[0]._id,
    });

    // Verify vote exists before deletion
    const voteBefore = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(voteBefore).toBe(topics[0]._id);

    await t.mutation(api.polls.deletePoll, {
      pollId: pollId as any,
      adminToken,
    });

    // Poll gone — topics.list returns [] because poll lookup fails
    const topicsAfter = await t.query(api.topics.list, { pollId: pollId as any });
    expect(topicsAfter).toHaveLength(0);

    // Groups gone
    const groupsAfter = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groupsAfter).toHaveLength(0);

    // Vote gone — was the bug: getCurrentVote uses index directly, would find
    // orphaned vote if deletePoll didn't clean up the votes table
    const voteAfter = await t.query(api.selections.getCurrentVote, {
      pollId: pollId as any,
      groupId: groupId as any,
    });
    expect(voteAfter).toBeNull();
  });

  test("removes all topics and groups for a claims poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      topicLabels: ["Topic A"],
    });
    const groupId = await createGroup(t, pollId);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topics[0]._id,
    });

    await t.mutation(api.polls.deletePoll, {
      pollId: pollId as any,
      adminToken,
    });

    const topicsAfter = await t.query(api.topics.list, { pollId: pollId as any });
    expect(topicsAfter).toHaveLength(0);

    const groupsAfter = await t.query(api.groups.list, { pollId: pollId as any });
    expect(groupsAfter).toHaveLength(0);
  });

  test("rejects an invalid admin token", async () => {
    const t = convexTest(schema);
    const { pollId } = await createPoll(t);

    await expect(
      t.mutation(api.polls.deletePoll, {
        pollId: pollId as any,
        adminToken: "not-the-right-token",
      })
    ).rejects.toThrow("Invalid admin token");
  });
});

// ---------------------------------------------------------------------------
// exportResults
// ---------------------------------------------------------------------------

describe("exportResults", () => {
  test("returns vote counts for a standard poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      pollType: "standard",
      topicLabels: ["Topic A", "Topic B"],
    });
    const [g1, g2] = await Promise.all([
      createGroup(t, pollId, "Alice"),
      createGroup(t, pollId, "Bob"),
    ]);
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicA = topics.find((t) => t.label === "Topic A")!;
    const topicB = topics.find((t) => t.label === "Topic B")!;

    // Two groups vote for A, none for B
    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: g1 as any,
      topicId: topicA._id,
    });
    await t.mutation(api.selections.vote, {
      pollId: pollId as any,
      groupId: g2 as any,
      topicId: topicA._id,
    });

    const results = await t.query(api.polls.exportResults, {
      pollId: pollId as any,
      adminToken,
    });

    const rowA = results.find((r) => r.topic === "Topic A")!;
    const rowB = results.find((r) => r.topic === "Topic B")!;

    expect(rowA.votes).toBe(2);
    expect(rowB.votes).toBe(0);
    // Claims-specific fields are empty for standard polls
    expect(rowA.members).toBe("");
    expect(rowA.selectedAt).toBe("");
  });

  test("returns member names and timestamp for a claims poll", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      topicLabels: ["Topic A", "Topic B"],
    });
    const groupId = await t.mutation(api.groups.createGroup, {
      pollId: pollId as any,
      members: [{ firstName: "Alice", lastName: "Smith" }],
    });
    const topics = await t.query(api.topics.list, { pollId: pollId as any });
    const topicA = topics.find((t) => t.label === "Topic A")!;

    await t.mutation(api.selections.claim, {
      pollId: pollId as any,
      groupId: groupId as any,
      topicId: topicA._id,
    });

    const results = await t.query(api.polls.exportResults, {
      pollId: pollId as any,
      adminToken,
    });

    const claimedRow = results.find((r) => r.topic === "Topic A")!;
    const unclaimedRow = results.find((r) => r.topic === "Topic B")!;

    expect(claimedRow.members).toBe("Alice Smith");
    expect(claimedRow.selectedAt).not.toBe("");
    expect(claimedRow.votes).toBeNull();

    expect(unclaimedRow.members).toBe("");
    expect(unclaimedRow.selectedAt).toBe("");
  });

  test("results are returned in topic order", async () => {
    const t = convexTest(schema);
    const { pollId, adminToken } = await createPoll(t, {
      pollType: "standard",
      topicLabels: ["Aardvark", "Banana", "Cherry"],
    });

    const results = await t.query(api.polls.exportResults, {
      pollId: pollId as any,
      adminToken,
    });

    expect(results.map((r) => r.topic)).toEqual(["Aardvark", "Banana", "Cherry"]);
  });

  test("rejects an invalid admin token", async () => {
    const t = convexTest(schema);
    const { pollId } = await createPoll(t);

    await expect(
      t.query(api.polls.exportResults, {
        pollId: pollId as any,
        adminToken: "wrong",
      })
    ).rejects.toThrow("Invalid admin token");
  });
});
