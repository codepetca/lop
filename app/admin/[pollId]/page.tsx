"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Check, Lock, Unlock, Plus, Download, ExternalLink, GripVertical } from "lucide-react";

export default function AdminManagePage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId: pollIdParam } = use(params);
  const pollId = pollIdParam as Id<"polls">;
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const [adminToken, setAdminToken] = useState(tokenParam || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newTopics, setNewTopics] = useState("");
  const [isAddingTopics, setIsAddingTopics] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });
  const exportResults = useQuery(
    isAuthenticated && adminToken
      ? api.polls.exportResults
      : "skip",
    isAuthenticated && adminToken ? { pollId, adminToken } : "skip"
  );

  const toggleOpen = useMutation(api.polls.toggleOpen);
  const addTopics = useMutation(api.polls.addTopics);
  const deleteTopic = useMutation(api.topics.deleteTopic);
  const reorderTopics = useMutation(api.topics.reorderTopics);

  const [draggedTopicId, setDraggedTopicId] = useState<Id<"topics"> | null>(null);

  useEffect(() => {
    if (poll && adminToken && poll.adminToken === adminToken) {
      setIsAuthenticated(true);
    }
  }, [poll, adminToken]);

  const handleToggleOpen = async () => {
    try {
      await toggleOpen({ pollId, adminToken });
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
    if (!confirm("Delete this topic? If claimed, the student's submission will also be removed.")) {
      return;
    }

    try {
      await deleteTopic({ topicId, adminToken });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDragStart = (topicId: Id<"topics">) => {
    setDraggedTopicId(topicId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetTopicId: Id<"topics">) => {
    if (!draggedTopicId || !topics || draggedTopicId === targetTopicId) {
      setDraggedTopicId(null);
      return;
    }

    const draggedIndex = topics.findIndex((t) => t._id === draggedTopicId);
    const targetIndex = topics.findIndex((t) => t._id === targetTopicId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTopicId(null);
      return;
    }

    // Create new order
    const reordered = [...topics];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Send to server
    try {
      await reorderTopics({
        pollId,
        adminToken,
        topicIds: reordered.map((t) => t._id),
      });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    setDraggedTopicId(null);
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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription className="text-base mt-2">
                    {poll.description}
                  </CardDescription>
                )}
              </div>
              <Button
                variant={poll.isOpen ? "destructive" : "default"}
                onClick={handleToggleOpen}
              >
                {poll.isOpen ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Close Poll
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Open Poll
                  </>
                )}
              </Button>
            </div>
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
                <span className="font-semibold">Progress:</span> {claimedCount} /{" "}
                {totalCount} topics claimed
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Share Links */}
        <Card>
          <CardHeader>
            <CardTitle>Share Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Student URL</Label>
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
                  size="icon"
                  onClick={() => window.open(studentUrl, "_blank")}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {copiedField === "student" && (
                <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Results URL</Label>
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
                  size="icon"
                  onClick={() => window.open(resultsUrl, "_blank")}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {copiedField === "results" && (
                <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Topics */}
            <div>
              <div className="space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic._id}
                    draggable
                    onDragStart={() => handleDragStart(topic._id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(topic._id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border bg-gray-50 cursor-move transition-opacity ${
                      draggedTopicId === topic._id ? "opacity-50" : "opacity-100"
                    }`}
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

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>Export Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportCSV} disabled={!exportResults}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
