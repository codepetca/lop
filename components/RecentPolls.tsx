"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SavedPoll } from "@/types/poll";

interface RecentPollsProps {
  polls: SavedPoll[];
}

export function RecentPolls({ polls }: RecentPollsProps) {
  const router = useRouter();

  if (polls.length === 0) return null;

  return (
    <div className="space-y-2">
      {polls.map((poll) => {
        const adminUrl = `/admin/${poll.pollId}?token=${poll.adminToken}`;

        return (
          <Card
            key={poll.pollId}
            onClick={() => router.push(adminUrl)}
            className="hover:bg-accent hover:border-info transition-colors cursor-pointer"
          >
            <CardContent className="pt-4">
              <h4 className="font-semibold">{poll.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
