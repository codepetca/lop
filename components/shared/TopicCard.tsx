"use client";

import { cn } from "@/lib/utils";
import { Member } from "@/types/member";

interface TopicCardProps {
  label: string;
  state: "available" | "selected" | "taken";
  selectedBy?: Member[] | null;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const stateStyles = {
  available: "border-border hover:border-info hover:bg-info-subtle cursor-pointer",
  selected: "border-success bg-success-subtle cursor-pointer",
  taken: "border-border bg-muted cursor-not-allowed opacity-60",
};

export function TopicCard({
  label,
  state,
  selectedBy,
  onClick,
  disabled = false,
  className,
}: TopicCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === "taken"}
      className={cn(
        "w-full p-4 rounded-lg border-2 text-left transition-all",
        stateStyles[state],
        className
      )}
    >
      <div className="font-medium">{label}</div>
      {state === "selected" && (
        <div className="text-sm text-muted-foreground mt-1">
          <span className="text-success font-semibold">✓ Your selection</span>
        </div>
      )}
      {state === "taken" && selectedBy && (
        <div className="text-sm text-muted-foreground mt-1">
          <span>
            Taken by{" "}
            {selectedBy.map((m) => `${m.firstName} ${m.lastName}`).join(", ")}
          </span>
        </div>
      )}
    </button>
  );
}
