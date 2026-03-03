"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface NavBarProps {
  showHomeButton?: boolean;
}

export function NavBar({ showHomeButton = false }: NavBarProps) {
  const router = useRouter();

  return (
    <div className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-2 relative flex items-center justify-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="absolute left-4 p-0 h-auto w-auto hover:bg-transparent"
        >
          <Home className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold">Claims Poll</span>
      </div>
    </div>
  );
}
