"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
          <MapPin className="size-5 text-emerald-400" />
          <span className="tracking-tight">
            Born <span className="text-muted-foreground">&amp;</span> Buried
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/leaderboard" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
          >
            <Trophy className="size-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Button>

          <AuthLoading>
            <Skeleton className="size-7 rounded-full" />
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
