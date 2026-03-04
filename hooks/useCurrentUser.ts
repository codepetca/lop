"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Tier = "anonymous" | "free" | "pro";

export interface CurrentUser {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  tier: Tier;
  email?: string;
  name?: string;
  image?: string;
}

export function useCurrentUser(): CurrentUser {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const user = useQuery(
    api.users.me,
    isAuthenticated ? {} : "skip"
  );

  if (isLoading || !isAuthenticated || user === undefined) {
    return { isAuthenticated: false, isLoading: true, isAnonymous: true, tier: "anonymous" };
  }

  return {
    isAuthenticated: true,
    isLoading: false,
    isAnonymous: user?.isAnonymous === true,
    tier: (user?.tier as Tier) ?? (user?.isAnonymous === true ? "anonymous" : "free"),
    email: user?.email ?? undefined,
    name: user?.name ?? undefined,
    image: user?.image ?? undefined,
  };
}
