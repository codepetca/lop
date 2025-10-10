"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentPolls } from "@/components/RecentPolls";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SavedPoll } from "@/types/poll";

export default function Home() {
  const router = useRouter();
  const [savedPolls, setSavedPolls] = useLocalStorage<SavedPoll[]>("myPolls", []);
  const [pollIdsToCheck, setPollIdsToCheck] = useState<string[]>([]);

  // Extract poll IDs when savedPolls loads
  useEffect(() => {
    if (savedPolls.length > 0) {
      setPollIdsToCheck(savedPolls.map((p) => p.pollId));
    }
  }, [savedPolls]);

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
      // Some polls were deleted, update state (useLocalStorage handles persistence)
      setSavedPolls(validPolls);
    }
  }, [existingPollIds, savedPolls]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-display font-bold mb-2">Claims Poll!</CardTitle>
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
