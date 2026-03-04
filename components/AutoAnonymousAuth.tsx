"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef } from "react";

/**
 * Silently signs in as an anonymous user on first visit so every visitor
 * gets a stable userId for poll ownership tracking.
 */
export function AutoAnonymousAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const attempted = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || attempted.current) return;
    attempted.current = true;
    void signIn("anonymous");
  }, [isLoading, isAuthenticated, signIn]);

  return null;
}
