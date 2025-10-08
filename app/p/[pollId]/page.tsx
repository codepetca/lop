"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Member {
  firstName: string;
  lastName: string;
}

export default function PollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId: pollIdParam } = use(params);
  const pollId = pollIdParam as Id<"polls">;

  const [members, setMembers] = useState<Member[]>([{ firstName: "", lastName: "" }]);
  const [groupId, setGroupId] = useState<Id<"groups"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string>("");

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });
  const groups = useQuery(api.groups.list, { pollId });
  const createGroup = useMutation(api.groups.findOrCreate);
  const updateGroup = useMutation(api.groups.update);
  const claimTopic = useMutation(api.selections.claim);
  const unclaimTopic = useMutation(api.selections.unclaim);

  // Check localStorage for saved group ID on mount
  useEffect(() => {
    const storageKey = `poll_${pollId}_groupId`;
    const savedGroupId = localStorage.getItem(storageKey);

    if (savedGroupId && groups) {
      // Verify the group still exists
      const group = groups.find((g) => g._id === savedGroupId);
      if (group) {
        setGroupId(savedGroupId as Id<"groups">);
        setMembers(group.members);
        setRecoveryCode(savedGroupId.slice(-8).toUpperCase());
      } else {
        // Group was deleted, clear localStorage
        localStorage.removeItem(storageKey);
      }
    }
  }, [pollId, groups]);

  // Get current selection for this group
  const currentSelection = useMemo(() => {
    if (!topics || !groupId) return null;
    return topics.find((t) => t.selectedByGroupId === groupId);
  }, [topics, groupId]);

  // Initialize members array based on poll requirement
  useMemo(() => {
    if (poll) {
      const requiredMembers = poll.membersPerGroup ?? 1;
      if (members.length !== requiredMembers) {
        setMembers(
          Array.from({ length: requiredMembers }, () => ({
            firstName: "",
            lastName: "",
          }))
        );
      }
    }
  }, [poll, members.length]);

  const updateMember = (index: number, field: "firstName" | "lastName", value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const trimmedMembers = members.map((m) => ({
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
      }));

      let newGroupId: Id<"groups">;

      if (groupId) {
        // Update existing group
        await updateGroup({
          groupId,
          members: trimmedMembers,
        });
        newGroupId = groupId;
      } else {
        // Create new group
        newGroupId = await createGroup({
          pollId,
          members: trimmedMembers,
        });
      }

      // Save to localStorage
      const storageKey = `poll_${pollId}_groupId`;
      localStorage.setItem(storageKey, newGroupId);

      // Set recovery code (last 8 chars of group ID)
      setRecoveryCode(newGroupId.slice(-8).toUpperCase());
      setGroupId(newGroupId);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimTopic = async (topicId: Id<"topics">) => {
    if (!groupId) return;

    // Check if clicking on currently selected topic (to unclaim)
    if (currentSelection && currentSelection._id === topicId) {
      if (!confirm(`Are you sure you want to remove "${currentSelection.label}" from your selection?`)) {
        return;
      }
      try {
        await unclaimTopic({ pollId, groupId });
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return;
    }

    // Check if already has a selection (changing to different topic)
    if (currentSelection) {
      const newTopic = topics?.find((t) => t._id === topicId);
      if (!confirm(`Change selection from "${currentSelection.label}" to "${newTopic?.label}"?`)) {
        return;
      }
    }

    try {
      await claimTopic({ pollId, groupId, topicId });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (poll === undefined || topics === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (poll === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Poll Not Found</CardTitle>
            <CardDescription>
              The poll you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!poll.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Poll Closed</CardTitle>
            <CardDescription>
              This poll is no longer accepting selections.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Poll Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-base">
                {poll.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Student Info Form */}
        {!groupId ? (
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitInfo} className="space-y-4">
                {/* All Members */}
                {members.map((member, index) => (
                  <div key={index} className="space-y-4">
                    {poll && (poll.membersPerGroup ?? 1) > 1 && (
                      <Label className="text-base">
                        Member {index + 1} {index === 0 && "(Primary)"}
                      </Label>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id={`firstName${index}`}
                        placeholder="First Name"
                        value={member.firstName}
                        onChange={(e) => updateMember(index, "firstName", e.target.value)}
                        required
                      />
                      <Input
                        id={`lastName${index}`}
                        placeholder="Last Name"
                        value={member.lastName}
                        onChange={(e) => updateMember(index, "lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Group Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <ul className="list-disc list-inside">
                    {members.map((m, i) => (
                      <li key={i}>
                        {m.firstName} {m.lastName}
                      </li>
                    ))}
                  </ul>
                  {recoveryCode && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Recovery Code</span>{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono font-semibold">
                        {recoveryCode}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topics Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Available Topics</CardTitle>
                <CardDescription>
                  Click on a topic to claim it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {topics.map((topic) => {
                    const isTaken =
                      topic.selectedByGroupId &&
                      topic.selectedByGroupId !== groupId;
                    const isYours = topic.selectedByGroupId === groupId;

                    return (
                      <button
                        key={topic._id}
                        onClick={() => handleClaimTopic(topic._id)}
                        disabled={isTaken}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${
                            isYours
                              ? "border-green-500 bg-green-50 cursor-pointer"
                              : isTaken
                              ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                              : "border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                          }
                        `}
                      >
                        <div className="font-medium">{topic.label}</div>
                        {topic.selectedBy && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {isYours ? (
                              <span className="text-green-600 font-semibold">
                                ✓ Your selection
                              </span>
                            ) : (
                              <span>
                                Taken by{" "}
                                {topic.selectedBy
                                  .map((m) => `${m.firstName} ${m.lastName}`)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
