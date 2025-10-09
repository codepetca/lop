"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Check, Lock, Unlock, Plus, Download, ExternalLink, GripVertical, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/use-confirm";
import { ShareLinks } from "@/components/ShareLinks";

export default function AdminManagePage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId: pollIdParam } = use(params);
  const pollId = pollIdParam as Id<"polls">;
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const router = useRouter();

  const [adminToken, setAdminToken] = useState(tokenParam || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newTopics, setNewTopics] = useState("");
  const [isAddingTopics, setIsAddingTopics] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });
  const exportResults = useQuery(
    api.polls.exportResults,
    isAuthenticated && adminToken && poll ? { pollId, adminToken } : "skip"
  );

  const toggleOpen = useMutation(api.polls.toggleOpen);
  const toggleResultsVisible = useMutation(api.polls.toggleResultsVisible);
  const updatePollDetails = useMutation(api.polls.updatePollDetails);
  const addTopics = useMutation(api.polls.addTopics);
  const deleteTopic = useMutation(api.topics.deleteTopic);
  const reorderTopics = useMutation(api.topics.reorderTopics);
  const clearAllClaims = useMutation(api.topics.clearAllClaims);
  const deletePoll = useMutation(api.polls.deletePoll);

  const [draggedTopicId, setDraggedTopicId] = useState<Id<"topics"> | null>(null);
  const [previewTopics, setPreviewTopics] = useState<typeof topics | null>(null);
  const [optimisticOrder, setOptimisticOrder] = useState<Id<"topics">[] | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");

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
    try {
      await toggleOpen({ pollId, adminToken });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleToggleResultsVisible = async () => {
    try {
      await toggleResultsVisible({ pollId, adminToken });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSaveTitle = async () => {
    if (!tempTitle.trim() || tempTitle === poll?.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updatePollDetails({ pollId, adminToken, title: tempTitle });
      setIsEditingTitle(false);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTempTitle(poll?.title || "");
    }
  };

  const handleSaveDescription = async () => {
    if (tempDescription === (poll?.description || "")) {
      setIsEditingDescription(false);
      return;
    }

    try {
      await updatePollDetails({ pollId, adminToken, description: tempDescription });
      setIsEditingDescription(false);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTempDescription(poll?.description || "");
    }
  };

  const handleAddTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopics.trim()) return;

    setIsAddingTopics(true);
    try {
      const topicLabels = newTopics
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t);

      await addTopics({ pollId, adminToken, topicLabels });
      setNewTopics("");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsAddingTopics(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      alert("Failed to copy to clipboard");
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

    try {
      await deleteTopic({ topicId, adminToken });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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

    try {
      const result = await clearAllClaims({ pollId, adminToken });
      alert(`Successfully cleared ${result.clearedCount} claim${result.clearedCount !== 1 ? 's' : ''}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleExportCSV = () => {
    if (!exportResults) return;

    const headers = ["Topic", "Members", "Selected At"];
    const rows = exportResults.map((r) => [
      r.topic,
      r.members,
      r.selectedAt,
    ]);

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

    try {
      await deletePoll({ pollId, adminToken });
      router.push("/");
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
                  alert("Invalid admin token");
                } else {
                  setIsAuthenticated(true);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="token">Admin Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            {isEditingTitle ? (
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setTempTitle(poll.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="text-2xl font-bold"
              />
            ) : (
              <CardTitle
                className="text-2xl cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  setTempTitle(poll.title);
                  setIsEditingTitle(true);
                }}
                title="Click to edit"
              >
                {poll.title}
              </CardTitle>
            )}
            {isEditingDescription ? (
              <Input
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleSaveDescription}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDescription();
                  if (e.key === "Escape") {
                    setTempDescription(poll.description || "");
                    setIsEditingDescription(false);
                  }
                }}
                autoFocus
                placeholder="Add a description..."
                className="text-base mt-2"
              />
            ) : (
              <CardDescription
                className="text-base mt-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  setTempDescription(poll.description || "");
                  setIsEditingDescription(true);
                }}
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
          onCopy={copyToClipboard}
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
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-move transition-[opacity,transform,background-color] duration-300 ease-in-out ${
                      draggedTopicId === topic._id
                        ? "opacity-40 bg-gray-200"
                        : "bg-gray-50 border-gray-300"
                    }`}
                    style={{ transition: "all 0.3s ease-in-out" }}
                    title="Drag to reorder topics"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{topic.label}</p>
                      {topic.selectedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Claimed by:{" "}
                          {topic.selectedBy
                            .map((m) => `${m.firstName} ${m.lastName}`)
                            .join(", ")}
                        </p>
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
