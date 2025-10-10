"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedPoll } from "@/types/poll";

interface RecentPollsProps {
  polls: SavedPoll[];
}

export function RecentPolls({ polls }: RecentPollsProps) {
  const router = useRouter();

  if (polls.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Recent Polls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {polls.map((poll) => {
            const adminUrl = `/admin/${poll.pollId}?token=${poll.adminToken}`;

            return (
              <div
                key={poll.pollId}
                onClick={() => router.push(adminUrl)}
                className="p-4 border rounded-lg hover:bg-accent hover:border-info transition-colors cursor-pointer"
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
      </CardContent>
    </Card>
  );
}
