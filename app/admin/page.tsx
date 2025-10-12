"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CircleHelp } from "lucide-react";
import { ShareLinks } from "@/components/ShareLinks";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { SavedPoll } from "@/types/poll";
import { MAX_SAVED_POLLS } from "@/lib/constants";

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [membersPerGroup, setMembersPerGroup] = useState(1);
  const [pollType, setPollType] = useState<"claims" | "standard">("claims");
  const [requireName, setRequireName] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPoll, setCreatedPoll] = useState<{
    pollId: string;
    adminToken: string;
  } | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [savedPolls, setSavedPolls] = useLocalStorage<SavedPoll[]>("myPolls", []);
  const { copiedId: copiedField, copyToClipboard } = useCopyToClipboard();

  const createPoll = useMutation(api.polls.create);

  const savePollToLocalStorage = (pollId: string, adminToken: string, pollTitle: string) => {
    const newPoll: SavedPoll = {
      pollId,
      adminToken,
      title: pollTitle,
      createdAt: Date.now(),
    };

    const existing = savedPolls.filter((p) => p.pollId !== pollId);
    const updated = [newPoll, ...existing].slice(0, MAX_SAVED_POLLS);

    setSavedPolls(updated);
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
        membersPerGroup: requireName ? membersPerGroup : 1,
        pollType,
        requireParticipantNames: requireName,
      });

      setCreatedPoll(result);
      savePollToLocalStorage(result.pollId, result.adminToken, title.trim());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };


  if (createdPoll) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const studentUrl = `${baseUrl}/p/${createdPoll.pollId}`;
    const adminUrl = `${baseUrl}/admin/${createdPoll.pollId}?token=${createdPoll.adminToken}`;
    const resultsUrl = `${baseUrl}/r/${createdPoll.pollId}`;

    return (
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <ShareLinks
            participantUrl={studentUrl}
            resultsUrl={resultsUrl}
            copiedField={copiedField}
            onCopy={(text, id) => copyToClipboard(text, id)}
            successMessage="Poll Created Successfully!"
          />

          <Card>
            <CardContent className="pt-6 space-y-2">
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Poll</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Poll Title</Label>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Advanced
                  </button>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  required
                  autoFocus
                />
              </div>

              {/* Advanced Options */}
              {showAdvancedOptions && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Poll Type</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="outline-none">
                            <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-80">
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold mb-1">Claims Poll</p>
                              <p className="text-sm text-muted-foreground">
                                Topics are claimed on a first-come basis. Each topic can only be selected by one participant.
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold mb-1">Standard Poll</p>
                              <p className="text-sm text-muted-foreground">
                                Multiple participants can vote for the same option. Results show vote counts.
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={pollType === "claims" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setPollType("claims")}
                      >
                        Claims
                      </Button>
                      <Button
                        type="button"
                        variant={pollType === "standard" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setPollType("standard")}
                      >
                        Standard
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder=""
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requireName"
                        checked={requireName}
                        onChange={(e) => setRequireName(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="requireName" className="cursor-pointer">
                        Require name
                      </Label>
                    </div>

                    {requireName && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="membersPerGroup" className="text-sm text-muted-foreground">
                          Number of participants per topic
                        </Label>
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
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topics">Topics</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="outline-none">
                        <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="w-80">
                      <p className="text-sm">Type or paste topics one per line</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder=""
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

      </div>
    </div>
  );
}
