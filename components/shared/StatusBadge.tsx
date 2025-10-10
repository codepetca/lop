import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "success" | "warning" | "info" | "muted";
  children: React.ReactNode;
  className?: string;
}

const statusStyles = {
  success: "bg-success-subtle text-success border-success",
  warning: "bg-warning-subtle text-warning border-warning",
  info: "bg-info-subtle text-info border-info",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}
