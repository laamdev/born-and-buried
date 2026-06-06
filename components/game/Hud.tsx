import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hud({
  round,
  totalRounds,
  score,
  strikes,
  maxStrikes,
  streak,
}: {
  round: number;
  totalRounds: number;
  score: number;
  strikes: number;
  maxStrikes: number;
  streak: number;
}) {
  const livesRemaining = Math.max(0, maxStrikes - strikes);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Round</span>
        <span className="font-mono text-sm font-semibold">
          {round} / {totalRounds}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: maxStrikes }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "size-5 transition-colors",
              i < livesRemaining
                ? "fill-rose-500 text-rose-500"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </div>

      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground">
          Score{streak > 1 ? ` · 🔥${streak}` : ""}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {score.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
