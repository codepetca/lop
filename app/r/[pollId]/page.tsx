"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePollId } from "@/hooks/usePollParams";
import { Grid3x3, List, AlignJustify } from "lucide-react";

export default function ResultsPage({ params }: { params: Promise<{ pollId: string }> }) {
  const pollId = usePollId(params);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");

  const poll = useQuery(api.polls.get, { pollId });
  const topics = useQuery(api.topics.list, { pollId });

  // Load view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("resultsViewMode");
    if (saved === "list" || saved === "grid" || saved === "compact") {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage
  const toggleViewMode = () => {
    const modes: Array<"grid" | "list" | "compact"> = ["grid", "list", "compact"];
    const currentIndex = modes.indexOf(viewMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setViewMode(nextMode);
    localStorage.setItem("resultsViewMode", nextMode);
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
      <EmptyState
        title="Poll Not Found"
        description="The poll you're looking for doesn't exist."
      />
    );
  }

  // Check if results are hidden
  if (poll.resultsVisible === false) {
    return (
      <EmptyState
        title="Results Hidden"
        description="The results for this poll are currently hidden."
      />
    );
  }

  // For standard polls, calculate total votes and sort by vote count
  const isStandardPoll = poll.pollType === "standard";
  const totalVotes = isStandardPoll
    ? topics.reduce((sum, t) => sum + ("voteCount" in t ? (t.voteCount as number) : 0), 0)
    : 0;
  const sortedTopics = isStandardPoll
    ? [...topics].sort((a, b) => {
        const aVotes = "voteCount" in a ? (a.voteCount as number) : 0;
        const bVotes = "voteCount" in b ? (b.voteCount as number) : 0;
        return bVotes - aVotes;
      })
    : topics;

  // Separate claimed and unclaimed topics for claims polls
  const claimedTopics = topics.filter((t) => t.selectedByGroupId);
  const unclaimedTopics = topics.filter((t) => !t.selectedByGroupId);

  return (
    <div className={viewMode === "compact" ? "min-h-screen bg-background p-3" : "min-h-screen bg-background p-6"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={viewMode === "compact" ? "mb-4" : "mb-8"}>
          <div className={viewMode === "compact" ? "flex items-start justify-between mb-2" : "flex items-start justify-between mb-4"}>
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-xl text-muted-foreground">
                  {poll.description}
                </p>
              )}
              <div
                className={
                  viewMode === "compact"
                    ? "mt-2 flex items-center justify-center gap-2"
                    : "mt-4 flex items-center justify-center gap-3"
                }
              >
                {isStandardPoll ? (
                  <>
                    <StatusBadge status="success">
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </StatusBadge>
                    <StatusBadge status="info">
                      {topics.length} {topics.length === 1 ? "option" : "options"}
                    </StatusBadge>
                  </>
                ) : (
                  <>
                    <StatusBadge status="success">
                      {claimedTopics.length} claimed
                    </StatusBadge>
                    <StatusBadge status="warning">
                      {unclaimedTopics.length} available
                    </StatusBadge>
                  </>
                )}
              </div>
            </div>
            {/* View Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleViewMode}
              title={
                viewMode === "grid"
                  ? "Switch to list view"
                  : viewMode === "list"
                  ? "Switch to compact view"
                  : "Switch to grid view"
              }
            >
              {viewMode === "grid" ? (
                <List className="h-6 w-6" />
              ) : viewMode === "list" ? (
                <AlignJustify className="h-6 w-6" />
              ) : (
                <Grid3x3 className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Standard Poll Results */}
        {isStandardPoll ? (
          <div>
            {/* Horizontal Bar View (list/compact) */}
            {viewMode !== "grid" ? (
              <div className="space-y-3">
                {(viewMode === "compact" ? topics : sortedTopics).map((topic) => {
                  const voteCount = "voteCount" in topic ? (topic.voteCount as number) : 0;
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                  return (
                    <div
                      key={topic._id}
                      className="bg-card border-2 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">
                          {topic.label}
                        </h3>
                        <div className="text-lg font-semibold">
                          {voteCount} {voteCount === 1 ? "vote" : "votes"}
                        </div>
                      </div>
                      <div className="relative w-full bg-muted rounded-full h-6">
                        <div
                          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 10 && (
                            <span className="text-xs font-medium text-primary-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        {percentage <= 10 && percentage > 0 && (
                          <span className="absolute top-1/2 -translate-y-1/2 left-2 text-xs font-medium text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vertical Bar Graph View */
              <div className="flex items-end justify-center gap-4 px-4">
                {(() => {
                  const maxVotes = Math.max(
                    ...topics.map((t) => ("voteCount" in t ? (t.voteCount as number) : 0)),
                    1
                  );
                  return topics.map((topic) => {
                  const voteCount = "voteCount" in topic ? (topic.voteCount as number) : 0;
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  const barHeightPercent = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

                  return (
                    <div key={topic._id} className="flex flex-col items-center gap-2 flex-1 max-w-32">
                      {/* Vote count label */}
                      <div className="text-lg font-semibold text-center min-h-8">
                        {voteCount > 0 && (
                          <>
                            {voteCount}
                            <div className="text-xs text-muted-foreground font-normal">
                              ({percentage.toFixed(1)}%)
                            </div>
                          </>
                        )}
                      </div>
                      {/* Bar container with fixed height */}
                      <div className="w-full h-80 flex items-end">
                        {voteCount > 0 ? (
                          <div
                            className="w-full bg-primary rounded-t-lg transition-all duration-500"
                            style={{ height: `${barHeightPercent}%` }}
                          >
                          </div>
                        ) : (
                          <div className="w-full"></div>
                        )}
                      </div>
                      {/* Topic label */}
                      <div className="text-sm font-medium text-center break-words w-full">
                        {topic.label}
                      </div>
                    </div>
                  );
                });
                })()}
              </div>
            )}
            {topics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-2xl text-muted-foreground">No options yet</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Claimed Topics */}
            {claimedTopics.length > 0 && (
              <div className={viewMode === "compact" ? "mb-4" : "mb-8"}>
                <h2
                  className={
                    viewMode === "compact"
                      ? "text-lg font-bold mb-2 text-success"
                      : "text-2xl font-bold mb-4 text-success"
                  }
                >
                  Claimed
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : viewMode === "compact"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-1"
                      : "space-y-3"
                  }
                >
                  {claimedTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className={
                        viewMode === "compact"
                          ? "bg-success-subtle border border-success rounded px-2 py-1"
                          : "bg-success-subtle border-2 border-success rounded-lg p-4"
                      }
                    >
                      <h3
                        className={
                          viewMode === "compact"
                            ? "font-semibold text-sm mb-0"
                            : "font-bold text-lg mb-2"
                        }
                      >
                        {topic.label}
                      </h3>
                      {topic.selectedBy && (
                        <div
                          className={
                            viewMode === "compact"
                              ? "text-xs text-muted-foreground"
                              : "text-sm text-muted-foreground"
                          }
                        >
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
                <h2
                  className={
                    viewMode === "compact"
                      ? "text-lg font-bold mb-2 text-warning"
                      : "text-2xl font-bold mb-4 text-warning"
                  }
                >
                  Available
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : viewMode === "compact"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-1"
                      : "space-y-3"
                  }
                >
                  {unclaimedTopics.map((topic) => (
                    <div
                      key={topic._id}
                      className={
                        viewMode === "compact"
                          ? "bg-warning-subtle border border-warning rounded px-2 py-1"
                          : "bg-warning-subtle border-2 border-warning rounded-lg p-4"
                      }
                    >
                      <h3
                        className={
                          viewMode === "compact"
                            ? "font-semibold text-sm"
                            : "font-bold text-lg"
                        }
                      >
                        {topic.label}
                      </h3>
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
          </>
        )}
      </div>
    </div>
  );
}
