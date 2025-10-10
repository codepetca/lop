"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Rabbit } from "lucide-react";

interface NavBarProps {
  showHomeButton?: boolean;
}

export function NavBar({ showHomeButton = false }: NavBarProps) {
  const router = useRouter();

  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="p-0 h-auto w-auto hover:bg-transparent"
        >
          <Rabbit className="h-7 w-7 text-blue-600" />
        </Button>
      </div>
    </div>
  );
}
