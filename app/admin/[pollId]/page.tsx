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
    isAuthenticated && adminToken ? { pollId, adminToken } : "skip"
  );

  const toggleOpen = useMutation(api.polls.toggleOpen);
  const toggleResultsVisible = useMutation(api.polls.toggleResultsVisible);
  const addTopics = useMutation(api.polls.addTopics);
  const deleteTopic = useMutation(api.topics.deleteTopic);
  const reorderTopics = useMutation(api.topics.reorderTopics);
  const clearAllClaims = useMutation(api.topics.clearAllClaims);
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
      description: "Delete this topic? If claimed, the student's submission will also be removed.",
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
      description: "Are you sure you want to clear all topic claims? This will remove all student selections.",
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
      router.push("/admin");
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
  const studentUrl = `${baseUrl}/p/${pollId}`;
  const resultsUrl = `${baseUrl}/r/${pollId}`;

  const claimedCount = topics.filter((t) => t.selectedByGroupId).length;
  const totalCount = topics.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-base mt-2">
                {poll.description}
              </CardDescription>
            )}
            <div className="flex gap-4 mt-4">
              <div className="text-sm">
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    poll.isOpen
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {poll.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Results:</span>{" "}
                <span
                  className={
                    (poll.resultsVisible ?? true)
                      ? "text-green-600 font-semibold"
                      : "text-gray-600 font-semibold"
                  }
                >
                  {(poll.resultsVisible ?? true) ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="text-sm">
                {claimedCount} / {totalCount} topics claimed
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Share */}
        <Card>
          <CardHeader>
            <CardTitle>Share</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Give this link to participants
              </p>
              <div className="flex gap-2">
                <Input
                  value={studentUrl}
                  readOnly
                  onClick={() => copyToClipboard(studentUrl, "student")}
                  className={`font-mono text-sm cursor-pointer transition-colors ${
                    copiedField === "student"
                      ? "border-green-500 bg-green-50"
                      : "hover:border-blue-500"
                  }`}
                  title="Click to copy"
                />
                <Button
                  variant="outline"
                  onClick={() => window.open(studentUrl, "_blank")}
                  className="w-32 shrink-0"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Take Poll
                </Button>
                <Button
                  variant={poll.isOpen ? "destructive" : "default"}
                  onClick={handleToggleOpen}
                  className="w-32 shrink-0"
                >
                  {poll.isOpen ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Close
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Open
                    </>
                  )}
                </Button>
              </div>
              {copiedField === "student" && (
                <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                View the realtime results
              </p>
              <div className="flex gap-2">
                <Input
                  value={resultsUrl}
                  readOnly
                  onClick={() => copyToClipboard(resultsUrl, "results")}
                  className={`font-mono text-sm cursor-pointer transition-colors ${
                    copiedField === "results"
                      ? "border-green-500 bg-green-50"
                      : "hover:border-blue-500"
                  }`}
                  title="Click to copy"
                />
                <Button
                  variant="outline"
                  onClick={() => window.open(resultsUrl, "_blank")}
                  className="w-32 shrink-0"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Results
                </Button>
                <Button
                  variant={(poll.resultsVisible ?? true) ? "destructive" : "default"}
                  onClick={handleToggleResultsVisible}
                  className="w-32 shrink-0"
                >
                  {(poll.resultsVisible ?? true) ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              {copiedField === "results" && (
                <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
              )}
            </div>
            <div className="pt-2">
              <Button onClick={handleExportCSV} disabled={!exportResults}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Topics</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllClaims}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Claims
              </Button>
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
                />
                <Button type="submit" disabled={isAddingTopics}>
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
