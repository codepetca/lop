"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/use-confirm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { TopicCard } from "@/components/shared/TopicCard";
import { usePollId } from "@/hooks/usePollParams";
import { Member } from "@/types/member";

export default function PollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const pollId = usePollId(params);

  // Check if in preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setIsPreviewMode(urlParams.get("preview") === "true");
    }
  }, []);

  const [members, setMembers] = useState<Member[]>([{ firstName: "", lastName: "" }]);
  const [groupId, setGroupId] = useState<Id<"groups"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSelectedTopicId, setPreviewSelectedTopicId] = useState<Id<"topics"> | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });
  const groups = useQuery(api.groups.list, { pollId });
  const createGroup = useMutation(api.groups.findOrCreate);
  const updateGroup = useMutation(api.groups.update);
  const claimTopic = useMutation(api.selections.claim);
  const unclaimTopic = useMutation(api.selections.unclaim);

  // Check localStorage for saved group ID on mount (skip in preview mode)
  useEffect(() => {
    if (isPreviewMode) return;

    const storageKey = `poll_${pollId}_groupId`;
    const savedGroupId = localStorage.getItem(storageKey);

    if (savedGroupId && groups) {
      // Verify the group still exists
      const group = groups.find((g) => g._id === savedGroupId);
      if (group) {
        setGroupId(savedGroupId as Id<"groups">);
        setMembers(group.members);
      } else {
        // Group was deleted, clear localStorage
        localStorage.removeItem(storageKey);
      }
    }
  }, [pollId, groups, isPreviewMode]);

  // Get current selection for this group
  const currentSelection = useMemo(() => {
    if (!topics || !groupId) return null;

    // In preview mode, use local state
    if (isPreviewMode && previewSelectedTopicId) {
      return topics.find((t) => t._id === previewSelectedTopicId) || null;
    }

    return topics.find((t) => t.selectedByGroupId === groupId);
  }, [topics, groupId, isPreviewMode, previewSelectedTopicId]);

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

    // In preview mode, just set a fake group ID without saving
    if (isPreviewMode) {
      setGroupId("preview-mode" as Id<"groups">);
      return;
    }

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

      setGroupId(newGroupId);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimTopic = async (topicId: Id<"topics">) => {
    if (!groupId) return;

    // In preview mode, just update local state
    if (isPreviewMode) {
      // Toggle if clicking same topic, otherwise change selection
      if (previewSelectedTopicId === topicId) {
        setPreviewSelectedTopicId(null);
      } else {
        setPreviewSelectedTopicId(topicId);
      }
      return;
    }

    // Check if clicking on currently selected topic (to unclaim)
    if (currentSelection && currentSelection._id === topicId) {
      const confirmed = await confirm({
        title: "Remove Selection",
        description: `Are you sure you want to remove "${currentSelection.label}" from your selection?`,
        actionLabel: "Remove",
        destructive: true,
      });

      if (!confirmed) return;

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
      const confirmed = await confirm({
        title: "Change Selection",
        description: `Change selection from "${currentSelection.label}" to "${newTopic?.label}"?`,
        actionLabel: "Change",
      });

      if (!confirmed) return;
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (poll === null) {
    return (
      <EmptyState
        title="Poll Not Found"
        description="The poll you're looking for doesn't exist."
      />
    );
  }

  if (!poll.isOpen) {
    return (
      <EmptyState
        title="Poll Closed"
        description="This poll is not accepting responses."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-warning/20 border-2 border-warning rounded-lg p-4 text-center">
            <p className="text-warning font-semibold">
              Preview Mode - No data will be saved
            </p>
          </div>
        )}

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
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitInfo} className="space-y-4">
                {/* All Members */}
                {members.map((member, index) => (
                  <div key={index} className="space-y-4">
                    {poll && (poll.membersPerGroup ?? 1) > 1 && (
                      <Label className="text-base">
                        Participant {index + 1} {index === 0 && "(Primary)"}
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
              <CardHeader>
                <CardTitle>Participant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {members.map((m, i) => (
                    <div key={i}>
                      {m.firstName} {m.lastName}
                    </div>
                  ))}
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

                    // In preview mode, check local state; otherwise check database
                    const isYours = isPreviewMode
                      ? previewSelectedTopicId === topic._id
                      : topic.selectedByGroupId === groupId;

                    const state = isYours
                      ? "selected"
                      : isTaken && !isPreviewMode
                      ? "taken"
                      : "available";

                    return (
                      <TopicCard
                        key={topic._id}
                        label={topic.label}
                        state={state}
                        selectedBy={!isPreviewMode && topic.selectedBy ? topic.selectedBy : null}
                        onClick={() => handleClaimTopic(topic._id)}
                        disabled={!isPreviewMode && isTaken}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}
