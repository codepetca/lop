"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SavedPoll {
  pollId: string;
  adminToken: string;
  title: string;
  createdAt: number;
}

export default function Home() {
  const router = useRouter();
  const [savedPolls, setSavedPolls] = useState<SavedPoll[]>([]);
  const [pollIdsToCheck, setPollIdsToCheck] = useState<string[]>([]);

  // Load saved polls from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("myPolls");
    if (saved) {
      try {
        const polls = JSON.parse(saved);
        setSavedPolls(polls);
        setPollIdsToCheck(polls.map((p: SavedPoll) => p.pollId));
      } catch (e) {
        console.error("Failed to load saved polls", e);
      }
    }
  }, []);

  // Validate which polls still exist
  const existingPollIds = useQuery(
    api.polls.validatePolls,
    pollIdsToCheck.length > 0 ? { pollIds: pollIdsToCheck } : "skip"
  );

  // Clean up non-existent polls
  useEffect(() => {
    if (!existingPollIds || savedPolls.length === 0) return;

    const validPolls = savedPolls.filter((poll) =>
      existingPollIds.includes(poll.pollId)
    );

    if (validPolls.length !== savedPolls.length) {
      // Some polls were deleted, update localStorage and state
      setSavedPolls(validPolls);
      localStorage.setItem("myPolls", JSON.stringify(validPolls));
    }
  }, [existingPollIds, savedPolls]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">Claims Poll</CardTitle>
          <CardDescription className="text-base">
            First-come first-served
            <br />
            No repeat topics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New Poll Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => router.push("/admin")}
              className="w-full"
            >
              Create New Poll
            </Button>
          </div>

          {/* My Recent Polls */}
          {savedPolls.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">My Recent Polls</h3>
              <div className="space-y-3">
                {savedPolls.map((poll) => {
                  const adminUrl = `/admin/${poll.pollId}?token=${poll.adminToken}`;

                  return (
                    <div
                      key={poll.pollId}
                      onClick={() => router.push(adminUrl)}
                      className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <div>
                        <h4 className="font-semibold">{poll.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(poll.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
