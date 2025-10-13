"use client";

import { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
  onDismiss: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function ErrorMessage({
  message,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 5000,
}: ErrorMessageProps) {
  useEffect(() => {
    if (message && autoDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [message, autoDismiss, autoDismissDelay, onDismiss]);

  if (!message) return null;

  return (
    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <p className="text-sm text-destructive flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-destructive hover:text-destructive/80 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
