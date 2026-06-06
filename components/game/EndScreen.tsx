"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { Trophy, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-center">
      <div className="font-mono text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function EndScreen({
  sessionId,
  score,
  roundsPlayed,
  strikes,
  totalRounds,
}: {
  sessionId: string;
  score: number;
  roundsPlayed: number;
  strikes: number;
  totalRounds: number;
}) {
  const { isAuthenticated } = useConvexAuth();
  const submitScore = useMutation(api.leaderboard.submitScore);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const attempted = useRef(false);

  const roundsCleared = Math.max(0, roundsPlayed - strikes);
  const accuracy = roundsPlayed > 0 ? Math.round((roundsCleared / roundsPlayed) * 100) : 0;

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;
    attempted.current = true;
    setSaving(true);
    submitScore({ sessionId: sessionId as Id<"gameSessions"> })
      .then((res) => {
        setSaved(true);
        toast.success(res.alreadySaved ? "Score already saved." : "Saved to the leaderboard!");
      })
      .catch(() => toast.error("Couldn't save your score."))
      .finally(() => setSaving(false));
  }, [isAuthenticated, sessionId, submitScore]);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="space-y-5 pt-6 text-center">
        <div className="space-y-1">
          <Trophy className="mx-auto size-8 text-amber-400" />
          <h1 className="text-2xl font-semibold">Game over</h1>
          <p className="font-mono text-3xl font-bold tabular-nums">
            {score.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">final score</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Cleared" value={`${roundsCleared}/${totalRounds}`} />
          <Stat label="Strikes" value={`${strikes}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-4 animate-spin" /> Saving…
              </span>
            ) : saved ? (
              "Your score is on the leaderboard."
            ) : null}
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm">Sign in to save this score to the leaderboard.</p>
            <SignInButton mode="modal">
              <Button className="w-full">Sign in to save</Button>
            </SignInButton>
          </div>
        )}

        <div className="flex gap-2">
          <Button render={<Link href="/" />} nativeButton={false} className="flex-1">
            <RotateCcw className="size-4" /> Play again
          </Button>
          <Button
            render={<Link href="/leaderboard" />}
            nativeButton={false}
            variant="outline"
            className="flex-1"
          >
            <Trophy className="size-4" /> Leaderboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
