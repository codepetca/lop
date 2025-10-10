"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePollId } from "@/hooks/usePollParams";
import { Grid3x3, List } from "lucide-react";

export default function ResultsPage({ params }: { params: Promise<{ pollId: string }> }) {
  const pollId = usePollId(params);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });

  // Load view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("resultsViewMode");
    if (saved === "list" || saved === "grid") {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage
  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("resultsViewMode", mode);
  };

  if (poll === undefined || topics === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (poll === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Poll Not Found</h1>
          <p className="text-xl text-muted-foreground">
            The poll you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Check if results are hidden
  if (poll.resultsVisible === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Results Hidden</h1>
          <p className="text-xl text-muted-foreground">
            The results for this poll are currently hidden.
          </p>
        </div>
      </div>
    );
  }

  // Separate claimed and unclaimed topics
  const claimedTopics = topics.filter((t) => t.selectedByGroupId);
  const unclaimedTopics = topics.filter((t) => !t.selectedByGroupId);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-xl text-muted-foreground">{poll.description}</p>
              )}
              <div className="mt-4 flex items-center justify-center gap-3">
                <StatusBadge status="success">
                  {claimedTopics.length} claimed
                </StatusBadge>
                <StatusBadge status="warning">
                  {unclaimedTopics.length} available
                </StatusBadge>
              </div>
            </div>
            {/* View Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleViewMode(viewMode === "grid" ? "list" : "grid")}
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? (
                <List className="h-6 w-6" />
              ) : (
                <Grid3x3 className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Claimed Topics */}
        {claimedTopics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-success">
              Claimed
            </h2>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {claimedTopics.map((topic) => (
                <div
                  key={topic._id}
                  className="bg-success-subtle border-2 border-success rounded-lg p-4"
                >
                  <h3 className="font-bold text-lg mb-2">{topic.label}</h3>
                  {topic.selectedBy && (
                    <div className="text-sm text-muted-foreground">
                      {topic.selectedBy.map((member, idx) => (
                        <p key={idx}>
                          {member.firstName} {member.lastName}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unclaimed Topics */}
        {unclaimedTopics.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-warning">
              Available
            </h2>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {unclaimedTopics.map((topic) => (
                <div
                  key={topic._id}
                  className="bg-warning-subtle border-2 border-warning rounded-lg p-4"
                >
                  <h3 className="font-bold text-lg">{topic.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Not claimed yet</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {topics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl text-muted-foreground">No topics yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
