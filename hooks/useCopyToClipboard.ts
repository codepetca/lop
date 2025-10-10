"use client";

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_TIMEOUT } from "@/lib/constants";

/**
 * Hook for copying text to clipboard with feedback state
 * @returns [copiedId, copyToClipboard, error] tuple
 */
export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id || "default");
      setError(null);

      setTimeout(() => {
        setCopiedId(null);
      }, COPY_FEEDBACK_TIMEOUT);
    } catch (err) {
      setError("Failed to copy to clipboard");
      console.error("Copy failed:", err);
    }
  }, []);

  return { copiedId, copyToClipboard, error };
}
