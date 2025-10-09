"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentPolls } from "@/components/RecentPolls";

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
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-2">Claims Poll!</CardTitle>
            <CardDescription className="text-base">
              No repeat topics
              <br />
              First-come first-served
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* My Recent Polls */}
        <RecentPolls polls={savedPolls} />
      </div>
    </div>
  );
}
