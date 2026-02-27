"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Download, GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useConfirm } from "@/components/ui/use-confirm";
import { ShareLinks } from "@/components/ShareLinks";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePollId, useAdminToken } from "@/hooks/usePollParams";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { getErrorMessage } from "@/lib/errors";

export default function AdminManagePage({ params }: { params: Promise<{ pollId: string }> }) {
  const pollId = usePollId(params);
  const tokenParam = useAdminToken();
  const router = useRouter();

  const [adminToken, setAdminToken] = useState(tokenParam || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newTopics, setNewTopics] = useState("");
  const [isAddingTopics, setIsAddingTopics] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const { copiedId: copiedField, copyToClipboard } = useCopyToClipboard();

  const poll = useQuery(api.polls.get, isDeleting ? "skip" : { pollId });
  const topics = useQuery(api.topics.list, isDeleting ? "skip" : { pollId });
  const exportResults = useQuery(
    api.polls.exportResults,
    isAuthenticated && adminToken && poll && !isDeleting ? { pollId, adminToken } : "skip"
  );

  const toggleOpen = useMutation(api.polls.toggleOpen);
  const toggleResultsVisible = useMutation(api.polls.toggleResultsVisible);
  const updatePollDetails = useMutation(api.polls.updatePollDetails);
  const addTopics = useMutation(api.polls.addTopics);
  const deleteTopic = useMutation(api.topics.deleteTopic);
  const reorderTopics = useMutation(api.topics.reorderTopics);
  const clearAllClaims = useMutation(api.topics.clearAllClaims);
  const unclaimTopic = useMutation(api.topics.unclaimTopic);
  const deletePoll = useMutation(api.polls.deletePoll);

  const [draggedTopicId, setDraggedTopicId] = useState<Id<"topics"> | null>(null);
  const [previewTopics, setPreviewTopics] = useState<typeof topics | null>(null);
  const [optimisticOrder, setOptimisticOrder] = useState<Id<"topics">[] | null>(null);


  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (poll && adminToken && poll.adminToken === adminToken) {
      setIsAuthenticated(true);
    }
  }, [poll, adminToken]);

  // Clear optimistic order when server data matches
  useEffect(() => {
    if (optimisticOrder && topics) {
      const serverMatches = optimisticOrder.every((id, i) => topics[i]?._id === id);
      if (serverMatches) {
        setOptimisticOrder(null);
      }
    }
  }, [optimisticOrder, topics]);

  const handleToggleOpen = async () => {
    setError(null);
    try {
      await toggleOpen({ pollId, adminToken });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleToggleResultsVisible = async () => {
    setError(null);
    try {
      await toggleResultsVisible({ pollId, adminToken });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const titleEdit = useInlineEdit(poll?.title || "", async (value) => {
    await updatePollDetails({ pollId, adminToken, title: value });
  });

  const descriptionEdit = useInlineEdit(poll?.description || "", async (value) => {
    await updatePollDetails({ pollId, adminToken, description: value });
  });

  const handleAddTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopics.trim()) return;

    setError(null);
    setIsAddingTopics(true);
    try {
      const topicLabels = newTopics
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t);

      await addTopics({ pollId, adminToken, topicLabels });
      setNewTopics("");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsAddingTopics(false);
    }
  };


  const handleDeleteTopic = async (topicId: Id<"topics">) => {
    const confirmed = await confirm({
      title: "Delete Topic",
      description: "Delete this topic? If claimed, the participant's submission will also be removed.",
      actionLabel: "Delete",
      destructive: true,
    });

    if (!confirmed) return;

    setError(null);
    try {
      await deleteTopic({ topicId, adminToken });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleDragStart = (topicId: Id<"topics">) => {
    setDraggedTopicId(topicId);
    setPreviewTopics(null);
  };

  const handleDragOver = (e: React.DragEvent, targetTopicId: Id<"topics">) => {
    e.preventDefault();
    if (!draggedTopicId || !topics || draggedTopicId === targetTopicId) {
      return;
    }

    const draggedIndex = topics.findIndex((t) => t._id === draggedTopicId);
    const targetIndex = topics.findIndex((t) => t._id === targetTopicId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Create preview order
    const reordered = [...topics];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    setPreviewTopics(reordered);
  };

  const handleDragEnd = () => {
    setDraggedTopicId(null);
    setPreviewTopics(null);
  };

  const handleDrop = async (targetTopicId: Id<"topics">) => {
    if (!draggedTopicId || !previewTopics) {
      setDraggedTopicId(null);
      setPreviewTopics(null);
      return;
    }

    // Use the preview order that's already been calculated
    const finalOrder = previewTopics;
    const finalOrderIds = finalOrder.map((t) => t._id);

    // Commit to optimistic order and clear drag states
    setOptimisticOrder(finalOrderIds);
    setDraggedTopicId(null);
    setPreviewTopics(null);

    // Send to server
    try {
      await reorderTopics({
        pollId,
        adminToken,
        topicIds: finalOrderIds,
      });
      // optimisticOrder will be cleared by useEffect when server confirms
    } catch (error) {
      setError(getErrorMessage(error));
      setOptimisticOrder(null);
    }
  };

  const handleClearAllClaims = async () => {
    const confirmed = await confirm({
      title: "Clear All Claims",
      description: "Remove all participant selections? This will not delete the topics.",
      actionLabel: "Clear All",
      destructive: true,
    });

    if (!confirmed) return;

    setError(null);
    try {
      await clearAllClaims({ pollId, adminToken });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleUnclaimTopic = async (topicId: Id<"topics">, topicLabel: string) => {
    const confirmed = await confirm({
      title: "Unclaim Topic",
      description: `Remove participant selection from "${topicLabel}"?`,
      actionLabel: "Unclaim",
      destructive: true,
    });

    if (!confirmed) return;

    setError(null);
    try {
      await unclaimTopic({ topicId, adminToken });
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleMoveUp = async (topicId: Id<"topics">) => {
    if (!topics) return;
    const currentIndex = topics.findIndex((t) => t._id === topicId);
    if (currentIndex <= 0) return; // Already at top

    const reordered = [...topics];
    [reordered[currentIndex - 1], reordered[currentIndex]] = [reordered[currentIndex], reordered[currentIndex - 1]];
    const finalOrderIds = reordered.map((t) => t._id);

    setOptimisticOrder(finalOrderIds);

    try {
      await reorderTopics({
        pollId,
        adminToken,
        topicIds: finalOrderIds,
      });
    } catch (error) {
      setError(getErrorMessage(error));
      setOptimisticOrder(null);
    }
  };

  const handleMoveDown = async (topicId: Id<"topics">) => {
    if (!topics) return;
    const currentIndex = topics.findIndex((t) => t._id === topicId);
    if (currentIndex < 0 || currentIndex >= topics.length - 1) return; // Already at bottom

    const reordered = [...topics];
    [reordered[currentIndex], reordered[currentIndex + 1]] = [reordered[currentIndex + 1], reordered[currentIndex]];
    const finalOrderIds = reordered.map((t) => t._id);

    setOptimisticOrder(finalOrderIds);

    try {
      await reorderTopics({
        pollId,
        adminToken,
        topicIds: finalOrderIds,
      });
    } catch (error) {
      setError(getErrorMessage(error));
      setOptimisticOrder(null);
    }
  };

  const handleExportCSV = () => {
    if (!exportResults) return;

    const isStandard = poll?.pollType === "standard";
    const headers = isStandard
      ? ["Topic", "Votes"]
      : ["Topic", "Members", "Selected At"];
    const rows = exportResults.map((r) =>
      isStandard
        ? [r.topic, String(r.votes ?? 0)]
        : [r.topic, r.members, r.selectedAt]
    );

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poll-${pollId}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeletePoll = async () => {
    const confirmed = await confirm({
      title: "Delete Poll",
      description: "Are you sure you want to permanently delete this poll? This will delete all topics, groups, and submissions. This action cannot be undone.",
      actionLabel: "Delete Poll",
      destructive: true,
    });

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deletePoll({ pollId, adminToken });
      router.push("/");
    } catch (error) {
      setIsDeleting(false);
      setError(getErrorMessage(error));
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Authentication Required</CardTitle>
            <CardDescription>
              Enter the admin token to manage this poll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (poll.adminToken !== adminToken) {
                  setAuthError("Invalid admin token");
                } else {
                  setAuthError(null);
                  setIsAuthenticated(true);
                }
              }}
              className="space-y-4"
            >
              {authError && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-sm text-destructive">
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">Admin Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={adminToken}
                  onChange={(e) => {
                    setAdminToken(e.target.value);
                    setAuthError(null);
                  }}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Authenticate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const participantUrl = `${baseUrl}/p/${pollId}`;
  const resultsUrl = `${baseUrl}/r/${pollId}`;

  const claimedCount = topics.filter((t) => t.selectedByGroupId).length;
  const totalCount = topics.length;

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Header */}
        <Card>
          <CardHeader>
            {titleEdit.isEditing ? (
              <Input
                value={titleEdit.tempValue}
                onChange={(e) => titleEdit.setTempValue(e.target.value)}
                onBlur={titleEdit.save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") titleEdit.save();
                  if (e.key === "Escape") titleEdit.cancel();
                }}
                autoFocus
                className="text-2xl font-bold"
              />
            ) : (
              <CardTitle
                className="text-2xl cursor-pointer hover:text-info transition-colors bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hover:from-info hover:to-info/70"
                onClick={titleEdit.startEditing}
                title="Click to edit"
              >
                {poll.title}
              </CardTitle>
            )}
            {descriptionEdit.isEditing ? (
              <Input
                value={descriptionEdit.tempValue}
                onChange={(e) => descriptionEdit.setTempValue(e.target.value)}
                onBlur={descriptionEdit.save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") descriptionEdit.save();
                  if (e.key === "Escape") descriptionEdit.cancel();
                }}
                autoFocus
                placeholder="Add a description..."
                className="text-base mt-2"
              />
            ) : (
              <CardDescription
                className="text-base mt-2 cursor-pointer hover:text-info transition-colors"
                onClick={descriptionEdit.startEditing}
                title="Click to edit"
              >
                {poll.description || "Click to add description"}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Share */}
        <ShareLinks
          participantUrl={participantUrl}
          resultsUrl={resultsUrl}
          copiedField={copiedField}
          onCopy={(text, id) => copyToClipboard(text, id)}
          showControls={true}
          poll={{
            isOpen: poll.isOpen,
            resultsVisible: poll.resultsVisible,
          }}
          onToggleOpen={handleToggleOpen}
          onToggleResultsVisible={handleToggleResultsVisible}
          onExportCSV={handleExportCSV}
          exportDisabled={!exportResults}
        />

        {/* Edit Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Topics</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {claimedCount} / {totalCount} topics claimed
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllClaims}
                  title="Unclaim all topics"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Claims
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Topics */}
            <div>
              <div className="space-y-2">
                {(previewTopics ||
                  (optimisticOrder && topics
                    ? optimisticOrder.map(id => topics.find(t => t._id === id)!).filter(Boolean)
                    : topics)
                ).map((topic) => (
                  <div
                    key={topic._id}
                    draggable
                    onDragStart={() => handleDragStart(topic._id)}
                    onDragOver={(e) => handleDragOver(e, topic._id)}
                    onDragEnd={handleDragEnd}
                    onDrop={() => handleDrop(topic._id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border md:cursor-move transition-[opacity,transform,background-color] duration-300 ease-in-out ${
                      draggedTopicId === topic._id
                        ? "opacity-40 bg-muted"
                        : "bg-accent border-border"
                    }`}
                    style={{ transition: "all 0.3s ease-in-out" }}
                    title="Drag to reorder topics"
                  >
                    {/* Mobile reorder buttons */}
                    <div className="flex flex-col gap-1 md:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(topic._id);
                        }}
                        className="p-0 h-4 w-4"
                        disabled={topics.findIndex((t) => t._id === topic._id) === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(topic._id);
                        }}
                        className="p-0 h-4 w-4"
                        disabled={topics.findIndex((t) => t._id === topic._id) === topics.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Desktop drag handle */}
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0 hidden md:block" />

                    <div className="flex-1">
                      <p className="font-medium">{topic.label}</p>
                      {topic.selectedBy && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {topic.selectedBy.map((m, idx) => (
                            <span key={idx}>
                              {idx > 0 && ", "}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnclaimTopic(topic._id, topic.label);
                                }}
                                className="hover:text-red-600 hover:underline cursor-pointer"
                                title="Click to unclaim"
                              >
                                {m.firstName} {m.lastName}
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic._id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete this topic"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Topics */}
            <div>
              <form onSubmit={handleAddTopics} className="space-y-4">
                <Textarea
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  placeholder="Add New Topics"
                  rows={4}
                  className="font-mono"
                  title="Enter topics, one per line"
                />
                <Button type="submit" disabled={isAddingTopics} title="Add new topics (one per line)">
                  {isAddingTopics ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Topics
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this poll and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeletePoll}
              title="Permanently delete this poll and all data"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Poll
            </Button>
          </CardContent>
        </Card>

      </div>
      <ConfirmDialog />
    </div>
  );
}
