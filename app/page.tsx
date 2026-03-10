"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecentPolls } from "@/components/RecentPolls";
import { GoogleLogo } from "@/components/SignInDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SavedPoll } from "@/types/poll";
import { X, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { getErrorMessage } from "@/lib/errors";
import { AnimatedTitle } from "@/components/AnimatedTitle";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  const router = useRouter();
  const { isAnonymous, isLoading: userLoading, tier } = useCurrentUser();
  const { signIn } = useAuthActions();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    void signIn("google");
  };

  const collapseOtherOptions = () => {
    setShowOtherOptions(false);
    setEmail("");
    setPassword("");
    setEmailError(null);
    setIsSignUp(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setIsEmailLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", isSignUp ? "signUp" : "signIn");
      await signIn("password", formData);
    } catch (err) {
      setEmailError(getErrorMessage(err));
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Server-side polls for signed-in (non-anonymous) users
  const serverPolls = useQuery(
    api.polls.myPolls,
    !userLoading && !isAnonymous ? {} : "skip"
  );

  // localStorage fallback for anonymous users
  const [savedPolls, setSavedPolls] = useLocalStorage<SavedPoll[]>("myPolls", []);
  const [pollIdsToCheck, setPollIdsToCheck] = useState<string[]>([]);

  useEffect(() => {
    if (isAnonymous && savedPolls.length > 0) {
      setPollIdsToCheck(savedPolls.map((p) => p.pollId));
    }
  }, [isAnonymous, savedPolls]);

  const existingPollIds = useQuery(
    api.polls.validatePolls,
    isAnonymous && pollIdsToCheck.length > 0 ? { pollIds: pollIdsToCheck } : "skip"
  );

  useEffect(() => {
    if (!existingPollIds || savedPolls.length === 0) return;
    const validPolls = savedPolls.filter((poll) => existingPollIds.includes(poll.pollId));
    if (validPolls.length !== savedPolls.length) setSavedPolls(validPolls);
  }, [existingPollIds, savedPolls]);

  // Build display list: server-side for signed-in users, localStorage for anonymous
  const displayPolls: SavedPoll[] = isAnonymous
    ? savedPolls
    : (serverPolls ?? []).map((p) => ({
        pollId: p.pollId,
        title: p.title,
        adminToken: p.adminToken,
        createdAt: p.createdAt,
      }));

  const tierLabel = tier === "pro" ? "Pro" : tier === "free" ? "Free" : null;

  return (
    <div className={`min-h-screen bg-background p-4 ${!userLoading && isAnonymous && !showOtherOptions ? "pb-16" : ""}`}>
      <NavBar />
      <div className="w-full max-w-2xl mx-auto space-y-2">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-display font-bold mb-2">
              <AnimatedTitle />
              {tierLabel && (
                <span className="ml-2 text-sm font-sans font-normal text-muted-foreground align-middle">
                  {tierLabel}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              Hop in. Vote.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!userLoading && (
              isAnonymous ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full gap-3"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleLogo />
                    )}
                    Sign in with Google
                  </Button>
                  {showOtherOptions && (
                    <Card>
                      <CardHeader className="pb-3 pt-3 px-4 flex flex-row items-center justify-end space-y-0">
                        <button
                          type="button"
                          onClick={collapseOtherOptions}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Collapse"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <form onSubmit={handleEmailSubmit} className="space-y-3">
                          {emailError && (
                            <p className="text-sm text-destructive text-center">{emailError}</p>
                          )}

                          <div className="space-y-1">
                            <Label htmlFor="home-email">Email</Label>
                            <Input
                              id="home-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="home-password">Password</Label>
                            <Input
                              id="home-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full" disabled={isEmailLoading}>
                            {isEmailLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isSignUp ? (
                              "Create account"
                            ) : (
                              "Sign in"
                            )}
                          </Button>

                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => { setIsSignUp(!isSignUp); setEmailError(null); }}
                              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                            >
                              {isSignUp
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Create one"}
                            </button>
                          </div>

                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => router.push("/admin")}
                              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                            >
                              Skip
                            </button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={() => router.push("/admin")}
                  className="w-full"
                >
                  Create a Poll
                </Button>
              )
            )}
          </CardContent>
        </Card>

        <RecentPolls polls={displayPolls} />
      </div>

      {!userLoading && isAnonymous && !showOtherOptions && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <button
            type="button"
            onClick={() => setShowOtherOptions(true)}
            className="text-[10px] text-muted-foreground/60 underline-offset-4 hover:underline"
          >
            options
          </button>
        </div>
      )}
    </div>
  );
}
