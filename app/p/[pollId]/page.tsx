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
import { Loader2 } from "lucide-react";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { getErrorMessage } from "@/lib/errors";

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
  const [error, setError] = useState<string | null>(null);
  const [previewSelectedTopicId, setPreviewSelectedTopicId] = useState<Id<"topics"> | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });
  const groups = useQuery(api.groups.list, { pollId });
  const currentVotedTopicId = useQuery(
    api.selections.getCurrentVote,
    groupId && !isPreviewMode && poll?.pollType === "standard" ? { pollId, groupId } : "skip"
  );
  const createGroup = useMutation(api.groups.createGroup);
  const updateGroup = useMutation(api.groups.update);
  const selfDeleteGroup = useMutation(api.groups.selfDelete);
  const claimTopic = useMutation(api.selections.claim);
  const unclaimTopic = useMutation(api.selections.unclaim);
  const voteTopic = useMutation(api.selections.vote);
  const unvoteTopic = useMutation(api.selections.unvote);

  const storageKey = `poll_${pollId}_groupId`;

  // Check localStorage for saved group ID on mount (skip in preview mode)
  useEffect(() => {
    if (isPreviewMode) return;

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

  // Auto-create group for anonymous polls
  useEffect(() => {
    if (!poll) return;
    if (groupId) return; // Already have a group
    if (poll.requireParticipantNames !== false) return; // Not anonymous

    // In preview mode, just set a fake group ID
    if (isPreviewMode) {
      setGroupId("preview-mode" as Id<"groups">);
      return;
    }

    // Automatically create a group for anonymous polls
    const autoJoin = async () => {
      setIsSubmitting(true);
      try {
        const newGroupId = await createGroup({
          pollId,
          members: [{ firstName: "Anonymous", lastName: "User" }],
        });

        // Save to localStorage
        localStorage.setItem(storageKey, newGroupId);

        setGroupId(newGroupId);
      } catch (error) {
        console.error("Failed to auto-join anonymous poll:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    autoJoin();
  }, [poll, groupId, isPreviewMode, pollId, createGroup]);

  // Get current selection/vote for this group
  const currentSelection = useMemo(() => {
    if (!topics || !groupId || !poll) return null;

    // In preview mode, use local state
    if (isPreviewMode && previewSelectedTopicId) {
      return topics.find((t) => t._id === previewSelectedTopicId) || null;
    }

    // For standard polls, use the currentVotedTopicId
    if (poll.pollType === "standard") {
      if (!currentVotedTopicId) return null;
      return topics.find((t) => t._id === currentVotedTopicId) || null;
    }

    // For claims polls, check selectedByGroupId
    return topics.find((t) => t.selectedByGroupId === groupId);
  }, [topics, groupId, poll, isPreviewMode, previewSelectedTopicId, currentVotedTopicId]);

  // Initialize members array based on poll requirement
  useEffect(() => {
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
  // members.length intentionally omitted — we only want this to run when
  // the poll's required count changes, not every time the user types a name.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll?.membersPerGroup]);

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
      localStorage.setItem(storageKey, newGroupId);

      setGroupId(newGroupId);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimTopic = async (topicId: Id<"topics">) => {
    if (!groupId || !poll) return;

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

    // Handle standard polls (voting)
    if (poll.pollType === "standard") {
      // Check if clicking on currently voted topic (to unvote)
      if (currentSelection && currentSelection._id === topicId) {
        const confirmed = await confirm({
          title: "Remove Vote",
          description: `Are you sure you want to deselect "${currentSelection.label}"?`,
          actionLabel: "Remove",
          destructive: true,
        });

        if (!confirmed) return;

        setError(null);
        try {
          await unvoteTopic({ pollId, groupId });
        } catch (error) {
          setError(getErrorMessage(error));
        }
        return;
      }

      // Check if already has a vote (changing to different topic)
      if (currentSelection) {
        const newTopic = topics?.find((t) => t._id === topicId);
        const confirmed = await confirm({
          title: "Change Vote",
          description: `Change vote from "${currentSelection.label}" to "${newTopic?.label}"?`,
          actionLabel: "Change",
        });

        if (!confirmed) return;
      }

      setError(null);
      try {
        await voteTopic({ pollId, groupId, topicId });
      } catch (error) {
        setError(getErrorMessage(error));
      }
      return;
    }

    // Handle claims polls (exclusive selection)
    // Check if clicking on currently selected topic (to unclaim)
    if (currentSelection && currentSelection._id === topicId) {
      const confirmed = await confirm({
        title: "Remove Selection",
        description: `Are you sure you want to deselect "${currentSelection.label}"?`,
        actionLabel: "Remove",
        destructive: true,
      });

      if (!confirmed) return;

      setError(null);
      try {
        await unclaimTopic({ pollId, groupId });
      } catch (error) {
        setError(getErrorMessage(error));
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

    setError(null);
    try {
      await claimTopic({ pollId, groupId, topicId });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleStartOver = async () => {
    if (!groupId) return;

    // In preview mode, just reset local state
    if (isPreviewMode) {
      setGroupId(null);
      setPreviewSelectedTopicId(null);
      if (poll) {
        const requiredMembers = poll.membersPerGroup ?? 1;
        setMembers(
          Array.from({ length: requiredMembers }, () => ({
            firstName: "",
            lastName: "",
          }))
        );
      }
      return;
    }

    const confirmed = await confirm({
      title: "Start Over",
      description: "This will remove your current selection and require you to re-enter your name. Continue?",
      actionLabel: "Start Over",
      destructive: true,
    });

    if (!confirmed) return;

    setError(null);
    setIsSubmitting(true);
    try {
      // Delete the group (also removes any selections)
      await selfDeleteGroup({ pollId, groupId });

      // Clear localStorage
      localStorage.removeItem(storageKey);

      // Reset state
      setGroupId(null);
      if (poll) {
        const requiredMembers = poll.membersPerGroup ?? 1;
        setMembers(
          Array.from({ length: requiredMembers }, () => ({
            firstName: "",
            lastName: "",
          }))
        );
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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

        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Poll Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {poll.title}
            </CardTitle>
            {poll.description && (
              <CardDescription className="text-base mt-2">
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
            {poll.requireParticipantNames !== false && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>{members.length > 1 ? "Participants" : "Participant"}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartOver}
                    disabled={isSubmitting}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  >
                    Start Over
                  </Button>
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
            )}

            {/* Topics Grid */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {poll.pollType === "standard" ? "Topics" : "Available Topics"}
                </CardTitle>
                <CardDescription>
                  {poll.pollType === "standard"
                    ? "Vote on a topic"
                    : "Choose a topic to claim it"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {topics.map((topic) => {
                    // For standard polls
                    if (poll.pollType === "standard") {
                      const voteCount = "voteCount" in topic ? (topic.voteCount as number) : 0;
                      const isYours = isPreviewMode
                        ? previewSelectedTopicId === topic._id
                        : currentVotedTopicId === topic._id;

                      return (
                        <button
                          key={topic._id}
                          onClick={() => handleClaimTopic(topic._id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isYours
                              ? "border-success bg-success-subtle cursor-pointer"
                              : "border-border hover:border-info hover:bg-info-subtle cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{topic.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {voteCount} {voteCount === 1 ? "vote" : "votes"}
                            </div>
                          </div>
                          {isYours && (
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="text-success font-semibold">✓ Your selection</span>
                            </div>
                          )}
                        </button>
                      );
                    }

                    // For claims polls
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
