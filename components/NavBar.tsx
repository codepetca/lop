"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Rabbit, LogOut } from "lucide-react";
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

  return (
    <>
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="p-0 h-auto w-auto hover:bg-transparent"
          >
            <Rabbit className="h-5 w-5 text-info" />
          </Button>

          <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && (
            isAnonymous ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignInOpen(true)}
              >
                Sign in
              </Button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-6 w-6 p-0 overflow-hidden" aria-label={name ?? email ?? "User menu"}>
                    {image ? (
                      <img src={image} alt={name ?? email ?? "User"} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
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
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
