"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentPolls } from "@/components/RecentPolls";
import { SignInDialog } from "@/components/SignInDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SavedPoll } from "@/types/poll";
import { UserRound } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAnonymous, isLoading: userLoading, tier } = useCurrentUser();
  const [signInOpen, setSignInOpen] = useState(false);

  // Server-side polls for signed-in (non-anonymous) users
  const serverPolls = useQuery(
    api.polls.myPolls,
    !userLoading && !isAnonymous ? {} : "skip"
  );

  // localStorage fallback for anonymous users
  const [savedPolls, setSavedPolls] = useLocalStorage<SavedPoll[]>("myPolls", []);
  const [pollIdsToCheck, setPollIdsToCheck] = useState<string[]>([]);

  useEffect(() => {
    if (isAnonymous && savedPolls.length > 0) {
      setPollIdsToCheck(savedPolls.map((p) => p.pollId));
    }
  }, [isAnonymous, savedPolls]);

  const existingPollIds = useQuery(
    api.polls.validatePolls,
    isAnonymous && pollIdsToCheck.length > 0 ? { pollIds: pollIdsToCheck } : "skip"
  );

  useEffect(() => {
    if (!existingPollIds || savedPolls.length === 0) return;
    const validPolls = savedPolls.filter((poll) => existingPollIds.includes(poll.pollId));
    if (validPolls.length !== savedPolls.length) setSavedPolls(validPolls);
  }, [existingPollIds, savedPolls]);

  // Build display list: server-side for signed-in users, localStorage for anonymous
  const displayPolls: SavedPoll[] = isAnonymous
    ? savedPolls
    : (serverPolls ?? []).map((p) => ({
        pollId: p.pollId,
        title: p.title,
        adminToken: p.adminToken,
        createdAt: p.createdAt,
      }));

  const tierLabel = tier === "pro" ? "Pro" : tier === "free" ? "Free" : null;

  return (
    <>
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl mx-auto space-y-2">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-display font-bold mb-2">
              Claims Poll
              {tierLabel && (
                <span className="ml-2 text-sm font-sans font-normal text-muted-foreground align-middle">
                  {tierLabel}
                </span>
          )}
            </CardTitle>
            <CardDescription className="text-base">
              No repeat topics
              <br />
              First-come first-served
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!userLoading && isAnonymous && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSignInOpen(true)}
                className="w-full"
              >
                <UserRound className="mr-2 h-5 w-5" />
                Sign in
              </Button>
            )}
            <Button
              size="lg"
              onClick={() => router.push("/admin")}
              className="w-full"
            >
              Create New Poll
            </Button>
          </CardContent>
        </Card>

        <RecentPolls polls={displayPolls} />
      </div>
    </div>
    <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
