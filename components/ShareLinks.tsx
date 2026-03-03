"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Share2, ExternalLink, Lock, Unlock, Eye, EyeOff, Download, Check, ChevronDown } from "lucide-react";

interface ShareLinksProps {
  participantUrl: string;
  resultsUrl: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  successMessage?: string;
  showControls?: boolean;
  hidePollRow?: boolean;
  poll?: {
    isOpen: boolean;
    resultsVisible?: boolean;
    topicsVisible?: boolean;
  };
  onToggleOpen?: () => void;
  onToggleTopicsVisible?: () => void;
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
  hidePollRow = false,
  poll,
  onToggleOpen,
  onToggleTopicsVisible,
  onToggleResultsVisible,
  onExportCSV,
  exportDisabled = false,
}: ShareLinksProps) {
  const resultsVisible = poll?.resultsVisible ?? true;

  return (
    <Card>
      {successMessage && (
        <CardHeader>
          <CardDescription className="text-success font-medium">
            {successMessage}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={`${successMessage ? "pt-0" : "pt-4"} space-y-3`}>

        {/* Poll row */}
        {!hidePollRow && <div className="flex flex-wrap items-center gap-2">
          <p className="text-2xl font-semibold leading-none tracking-tight w-24 shrink-0">Poll</p>
          <Button
            size="sm"
            variant={copiedField === "student" ? "success" : "default"}
            className="px-8 transition-all"
            onClick={() => onCopy(participantUrl, "student")}
          >
            {copiedField === "student"
              ? <Check className="mr-1.5 h-3.5 w-3.5" />
              : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
            {copiedField === "student" ? "URL Copied!" : "Share"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`${participantUrl}?preview=true`, "_blank")} title="Preview">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          {showControls && poll && onToggleTopicsVisible && (
            <Button
              variant={poll.isOpen || (poll.topicsVisible ?? false) ? "success" : "warning"}
              size="sm"
              onClick={poll.isOpen ? undefined : onToggleTopicsVisible}
              disabled={poll.isOpen}
              title={poll.isOpen ? "Topics always visible when poll is open" : (poll.topicsVisible ?? false) ? "Topics visible to students" : "Topics hidden from students"}
            >
              {poll.isOpen || (poll.topicsVisible ?? false) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          )}
          {showControls && poll && onToggleOpen && (
            <Button variant={poll.isOpen ? "success" : "warning"} size="sm" onClick={onToggleOpen} title={poll.isOpen ? "Poll opened" : "Poll closed"}>
              {poll.isOpen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>}

        {/* Results row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Split button: Results Link + dropdown for CSV download */}
          <div className="flex">
            <Button
              size="sm"
              variant={copiedField === "results" ? "success" : "default"}
              className="min-w-44 transition-all rounded-r-none"
              onClick={() => onCopy(resultsUrl, "results")}
            >
              {copiedField === "results"
                ? <Check className="mr-1.5 h-3.5 w-3.5" />
                : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
              {copiedField === "results" ? "URL Copied!" : "Results Link"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant={copiedField === "results" ? "success" : "default"}
                  className="rounded-l-none border-l border-l-white/20 px-2 transition-all"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {showControls && onExportCSV && (
                  <DropdownMenuItem onClick={onExportCSV} disabled={exportDisabled}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {showControls && poll && onToggleResultsVisible && (
            <Button variant={resultsVisible ? "success" : "warning"} size="sm" onClick={onToggleResultsVisible} title={resultsVisible ? "Visible" : "Hidden"}>
              {resultsVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
