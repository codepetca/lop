"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, Lock, Unlock } from "lucide-react";

interface ShareLinksProps {
  participantUrl: string;
  resultsUrl: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  successMessage?: string;
  showControls?: boolean;
  poll?: {
    isOpen: boolean;
    resultsVisible?: boolean;
  };
  onToggleOpen?: () => void;
  onToggleResultsVisible?: () => void;
  onExportCSV?: () => void;
  exportDisabled?: boolean;
}

export function ShareLinks({
  participantUrl,
  resultsUrl,
  copiedField,
  onCopy,
  successMessage,
  showControls = false,
  poll,
  onToggleOpen,
  onToggleResultsVisible,
  onExportCSV,
  exportDisabled = false,
}: ShareLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share</CardTitle>
        {successMessage && (
          <CardDescription className="text-green-600 font-medium">
            {successMessage}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Give this link to participants
          </p>
          <div className="flex gap-2">
            <Input
              value={participantUrl}
              readOnly
              onClick={() => onCopy(participantUrl, "student")}
              className={`font-mono text-sm cursor-pointer transition-colors ${
                copiedField === "student"
                  ? "border-green-500 bg-green-50"
                  : "hover:border-blue-500"
              }`}
              title="Click to copy"
            />
            <Button
              variant="outline"
              onClick={() => window.open(`${participantUrl}?preview=true`, "_blank")}
              className="w-36 shrink-0"
              title="Preview poll as a participant"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </Button>
            {showControls && poll && onToggleOpen && (
              <Button
                variant="default"
                onClick={onToggleOpen}
                className={poll.isOpen ? "bg-green-600 hover:bg-green-700 w-44 shrink-0" : "bg-yellow-500 hover:bg-yellow-600 w-44 shrink-0"}
                title={poll.isOpen ? "Click to close poll" : "Click to open poll"}
              >
                {poll.isOpen ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Poll is Open
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Poll is Closed
                  </>
                )}
              </Button>
            )}
          </div>
          {copiedField === "student" && (
            <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            View the realtime results
          </p>
          <div className="flex gap-2">
            <Input
              value={resultsUrl}
              readOnly
              onClick={() => onCopy(resultsUrl, "results")}
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
              title="View results board"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Results
            </Button>
            {showControls && poll && onToggleResultsVisible && (
              <Button
                variant="default"
                onClick={onToggleResultsVisible}
                className={(poll.resultsVisible ?? true) ? "bg-green-600 hover:bg-green-700 w-44 shrink-0" : "bg-yellow-500 hover:bg-yellow-600 w-44 shrink-0"}
                title={(poll.resultsVisible ?? true) ? "Click to hide results" : "Click to show results"}
              >
                {(poll.resultsVisible ?? true) ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Results Visible
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Results Hidden
                  </>
                )}
              </Button>
            )}
          </div>
          {copiedField === "results" && (
            <p className="text-xs text-green-600 font-medium">✓ Copied to clipboard</p>
          )}
        </div>
        {showControls && onExportCSV && (
          <div className="pt-2">
            <Button onClick={onExportCSV} disabled={exportDisabled} title="Export results as CSV">
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
