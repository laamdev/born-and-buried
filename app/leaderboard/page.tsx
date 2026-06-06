"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TopScores() {
  const rows = useQuery(api.leaderboard.topScores, { limit: 25 });
  if (rows === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No scores yet — be the first to make the board.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-border/60">
      {rows.map((r, i) => (
        <li key={r._id} className="flex items-center gap-3 py-2.5">
          <span className="w-6 text-center font-mono text-sm text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{r.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {r.roundsCleared} cleared · {Math.round(r.accuracy * 100)}% ·{" "}
              {r.categoryFilter} · {fmtDate(r.playedAt)}
            </p>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {r.score.toLocaleString()}
          </span>
        </li>
      ))}
    </ol>
  );
}

function MyHistory() {
  const rows = useQuery(api.leaderboard.myHistory, { limit: 10 });
  if (rows === undefined) return <Skeleton className="h-32 w-full" />;
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        You haven&apos;t saved any games yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((r) => (
        <li key={r._id} className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">
            {fmtDate(r.playedAt)} · {r.roundsCleared} cleared · {r.categoryFilter}
          </span>
          <span className="font-mono font-semibold tabular-nums">
            {r.score.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function LeaderboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <div className="flex items-center gap-2">
        <Trophy className="size-6 text-amber-400" />
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TopScores />
        </CardContent>
      </Card>

      <Authenticated>
        <div>
          <Separator className="mb-4" />
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Your recent games
          </h2>
          <Card>
            <CardContent className="pt-6">
              <MyHistory />
            </CardContent>
          </Card>
        </div>
      </Authenticated>
      <Unauthenticated>
        <p className="text-center text-sm text-muted-foreground">
          Sign in to save your scores and track your history.
        </p>
      </Unauthenticated>
    </div>
  );
}
