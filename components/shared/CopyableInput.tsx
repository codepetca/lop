"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CopyableInputProps {
  value: string;
  onCopy: () => void;
  isCopied?: boolean;
  className?: string;
  placeholder?: string;
}

export function CopyableInput({
  value,
  onCopy,
  isCopied = false,
  className,
  placeholder,
}: CopyableInputProps) {
  return (
    <Input
      value={value}
      readOnly
      onClick={onCopy}
      placeholder={placeholder}
      className={cn(
        "font-mono text-sm cursor-pointer transition-colors",
        isCopied
          ? "border-success bg-success-subtle"
          : "hover:border-info",
        className
      )}
      title="Click to copy"
    />
  );
}
