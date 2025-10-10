"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Extract and type poll ID from URL params
 */
export function usePollId(params: Promise<{ pollId: string }>): Id<"polls"> {
  const { pollId } = use(params);
  return pollId as Id<"polls">;
}

/**
 * Extract admin token from URL search params
 */
export function useAdminToken(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get("token");
}
