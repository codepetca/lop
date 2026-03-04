"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Home, LogOut, UserRound } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SignInDialog } from "@/components/SignInDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavBarProps {
  showHomeButton?: boolean;
}

export function NavBar({ showHomeButton = false }: NavBarProps) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isLoading, isAnonymous, email, name, image } = useCurrentUser();
  const [signInOpen, setSignInOpen] = useState(false);

  const initial = (name ?? email ?? "?")[0].toUpperCase();

  const AVATAR_COLORS = [
    "#e11d48", "#ea580c", "#d97706", "#16a34a",
    "#0d9488", "#0284c7", "#4f46e5", "#7c3aed", "#c026d3",
  ];
  const avatarBg = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <>
      <div className="sticky top-0 z-50 max-w-2xl mx-auto border-b rounded-b-lg bg-card px-4 py-4 relative flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="absolute left-4 p-0 h-auto w-auto hover:bg-transparent"
          >
            <Home className="h-5 w-5" />
          </Button>

          <div className="absolute right-4 flex items-center gap-2">
            <ThemeToggle />
            {!isLoading && (
              isAnonymous ? (
                <button
                  onClick={() => setSignInOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Sign in"
                >
                  <UserRound className="h-5 w-5" />
                </button>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="rounded-full h-7 w-7 p-0 overflow-hidden" aria-label={name ?? email ?? "User menu"}>
                      {image ? (
                        <img src={image} alt={name ?? email ?? "User"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: avatarBg }}>
                          {initial}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-44 p-1">
                    <button
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </PopoverContent>
                </Popover>
              )
            )}
          </div>
        </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
