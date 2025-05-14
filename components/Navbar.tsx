"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-4">
        {session?.user ? (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {session.user.name}
            </span>
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="text-sm"
            >
              Log out
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
