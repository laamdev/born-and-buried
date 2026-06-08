"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hud } from "./Hud";
import { RoundTimer } from "./RoundTimer";
import { GuessCombobox } from "./GuessCombobox";
import { RevealCard, type RevealData } from "./RevealCard";
import { EndScreen } from "./EndScreen";
import type { MapPoint } from "./GameMap";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// MapLibre touches `window`, so it must not render on the server.
const GameMap = dynamic(() => import("./GameMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type RoundGeo = { category: string; birth: MapPoint; death: MapPoint };

type GuessResult = {
  correct: boolean;
  timedOut: boolean;
  pointsAwarded: number;
  isGameOver: boolean;
  reveal: RevealData;
};

export function GameClient({ sessionId }: { sessionId: string }) {
  const sid = sessionId as Id<"gameSessions">;
  const data = useQuery(api.games.getCurrentRound, { sessionId: sid });
  const figures = useQuery(api.figures.listForCombobox);
  const submitGuess = useMutation(api.games.submitGuess);
  const submitTimeout = useMutation(api.games.submitTimeout);

  const [reveal, setReveal] = useState<GuessResult | null>(null);
  const [playedRound, setPlayedRound] = useState<RoundGeo | null>(null);
  const [busy, setBusy] = useState(false);

  const handleGuess = useCallback(
    async (figureId: string) => {
      if (busy || reveal || !data?.round) return;
      setBusy(true);
      setPlayedRound(data.round as RoundGeo);
      try {
        const res = await submitGuess({ sessionId: sid, guessFigureId: figureId as Id<"figures"> });
        setReveal(res as GuessResult);
      } finally {
        setBusy(false);
      }
    },
    [busy, reveal, data, sid, submitGuess],
  );

  const handleTimeout = useCallback(async () => {
    if (busy || reveal || !data?.round) return;
    setBusy(true);
    setPlayedRound(data.round as RoundGeo);
    try {
      const res = await submitTimeout({ sessionId: sid });
      if ("tooEarly" in res && res.tooEarly) return;
      setReveal(res as GuessResult);
    } finally {
      setBusy(false);
    }
  }, [busy, reveal, data, sid, submitTimeout]);

  const handleNext = useCallback(() => {
    setReveal(null);
    setPlayedRound(null);
  }, []);

  if (data === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 p-4">
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">That game session wasn&apos;t found.</p>
        <Button render={<Link href="/" />} nativeButton={false}>
          Start a new game
        </Button>
      </div>
    );
  }

  // Finished and the player dismissed the final reveal → results.
  if (data.status === "finished" && !reveal) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-4">
        <EndScreen
          sessionId={sessionId}
          score={data.score}
          roundsPlayed={data.roundIndex}
          strikes={data.strikes}
          totalRounds={data.totalRounds}
        />
      </div>
    );
  }

  // During a reveal, freeze the map on the round we just played; otherwise show
  // the current round (which never contains the answer's identity).
  const shownRound: RoundGeo | null = reveal ? playedRound : (data.round as RoundGeo | null);

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <div className="h-[45vh] overflow-hidden rounded-xl border border-border/60 lg:h-full lg:min-h-[520px]">
        {shownRound ? (
          <GameMap birth={shownRound.birth} death={shownRound.death} />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Hud
          round={Math.min(data.roundIndex + 1, data.totalRounds)}
          totalRounds={data.totalRounds}
          score={data.score}
          strikes={data.strikes}
          maxStrikes={data.maxStrikes}
          streak={data.streak}
        />

        {!reveal && data.round ? (
          <RoundTimer
            roundStartedAt={data.roundStartedAt}
            roundSeconds={data.roundSeconds}
            active={data.status === "active"}
            onExpire={handleTimeout}
          />
        ) : null}

        {reveal ? (
          <RevealCard
            reveal={reveal.reveal}
            correct={reveal.correct}
            timedOut={reveal.timedOut}
            pointsAwarded={reveal.pointsAwarded}
            isGameOver={reveal.isGameOver}
            onNext={handleNext}
          />
        ) : data.round ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="text-sm text-muted-foreground">
              Two places, two years —{" "}
              <span className="text-foreground">who lived this life?</span> One guess.
            </p>
            <GuessCombobox
              figures={figures ?? []}
              disabled={busy || figures === undefined}
              onGuess={handleGuess}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
