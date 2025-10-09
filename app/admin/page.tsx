"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, Copy, Check, History, ExternalLink } from "lucide-react";

interface SavedPoll {
  pollId: string;
  adminToken: string;
  title: string;
  createdAt: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [membersPerGroup, setMembersPerGroup] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPoll, setCreatedPoll] = useState<{
    pollId: string;
    adminToken: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedPolls, setSavedPolls] = useState<SavedPoll[]>([]);

  const createPoll = useMutation(api.polls.create);

  // Load saved polls from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("myPolls");
    if (saved) {
      try {
        setSavedPolls(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved polls", e);
      }
    }
  }, []);

  const savePollToLocalStorage = (pollId: string, adminToken: string, pollTitle: string) => {
    const newPoll: SavedPoll = {
      pollId,
      adminToken,
      title: pollTitle,
      createdAt: Date.now(),
    };

    const existing = savedPolls.filter((p) => p.pollId !== pollId);
    const updated = [newPoll, ...existing].slice(0, 10); // Keep last 10

    setSavedPolls(updated);
    localStorage.setItem("myPolls", JSON.stringify(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topics.trim()) return;

    setIsCreating(true);
    try {
      const topicLabels = topics
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t);

      const result = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        topicLabels,
        membersPerGroup,
      });

      setCreatedPoll(result);
      savePollToLocalStorage(result.pollId, result.adminToken, title.trim());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
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

  if (createdPoll) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const studentUrl = `${baseUrl}/p/${createdPoll.pollId}`;
    const adminUrl = `${baseUrl}/admin/${createdPoll.pollId}?token=${createdPoll.adminToken}`;
    const resultsUrl = `${baseUrl}/r/${createdPoll.pollId}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">
                Poll Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Take Poll */}
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
                    onClick={() => window.open(`${studentUrl}?preview=true`, "_blank")}
                    className="w-36 shrink-0"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
                {copiedField === "student" && (
                  <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
                )}
              </div>

              {/* Results */}
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
                    className="w-36 shrink-0"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Results
                  </Button>
                </div>
                {copiedField === "results" && (
                  <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => router.push(adminUrl)}
                >
                  Go to Admin Panel
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCreatedPoll(null);
                    setTitle("");
                    setDescription("");
                    setTopics("");
                  }}
                >
                  Create Another Poll
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Claims Poll</CardTitle>
            <CardDescription>
              Topics are claimed on a first-come basis and removed once selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description (optional)
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder=""
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="membersPerGroup">Members per Group *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={membersPerGroup}
                    onChange={(e) => setMembersPerGroup(parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <Slider
                    id="membersPerGroup"
                    min={1}
                    max={10}
                    step={1}
                    value={[membersPerGroup]}
                    onValueChange={(value) => setMembersPerGroup(value[0])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Topics *</Label>
                <Textarea
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Type or paste topics one per line"
                  rows={10}
                  required
                  className="font-mono"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Poll...
                  </>
                ) : (
                  "Create Poll"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recently Created Polls */}
        {savedPolls.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                My Recent Polls
              </CardTitle>
              <CardDescription>
                Polls you&apos;ve created on this device (stored locally)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedPolls.map((poll) => {
                  const adminUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/admin/${poll.pollId}?token=${poll.adminToken}`;

                  return (
                    <div
                      key={poll.pollId}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{poll.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {new Date(poll.createdAt).toLocaleDateString()} at{" "}
                            {new Date(poll.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(adminUrl)}
                        >
                          Open Admin Panel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: These links are stored in your browser. Clear your browser data and they&apos;ll be lost.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
