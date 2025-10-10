"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyableInput } from "@/components/shared/CopyableInput";
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
          <CardDescription className="text-success font-medium">
            {successMessage}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this link with participants
          </p>
          {/* Mobile Layout */}
          <div className="md:hidden space-y-2">
            <CopyableInput
              value={participantUrl}
              onCopy={() => onCopy(participantUrl, "student")}
              isCopied={copiedField === "student"}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(`${participantUrl}?preview=true`, "_blank")}
                className="flex-1"
                title="Preview poll as a participant"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Button>
              {showControls && poll && onToggleOpen && (
                <Button
                  variant={poll.isOpen ? "success" : "warning"}
                  onClick={onToggleOpen}
                  className="flex-1"
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
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:flex gap-2">
            <CopyableInput
              value={participantUrl}
              onCopy={() => onCopy(participantUrl, "student")}
              isCopied={copiedField === "student"}
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
                variant={poll.isOpen ? "success" : "warning"}
                onClick={onToggleOpen}
                className="w-44 shrink-0"
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
            <p className="text-xs text-success font-medium">✓ Copied to clipboard</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share the realtime results
          </p>
          {/* Mobile Layout */}
          <div className="md:hidden space-y-2">
            <CopyableInput
              value={resultsUrl}
              onCopy={() => onCopy(resultsUrl, "results")}
              isCopied={copiedField === "results"}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(resultsUrl, "_blank")}
                className="flex-1"
                title="View results board"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Results
              </Button>
              {showControls && poll && onToggleResultsVisible && (
                <Button
                  variant={(poll.resultsVisible ?? true) ? "success" : "warning"}
                  onClick={onToggleResultsVisible}
                  className="flex-1"
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
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:flex gap-2">
            <CopyableInput
              value={resultsUrl}
              onCopy={() => onCopy(resultsUrl, "results")}
              isCopied={copiedField === "results"}
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
                variant={(poll.resultsVisible ?? true) ? "success" : "warning"}
                onClick={onToggleResultsVisible}
                className="w-44 shrink-0"
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
            <p className="text-xs text-success font-medium">✓ Copied to clipboard</p>
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
