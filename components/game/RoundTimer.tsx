"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Display-only countdown. The server is the source of truth for the time bonus
// and timeout strike; this just visualizes time left and fires onExpire once so
// the client can tell the server the round timed out.
export function RoundTimer({
  roundStartedAt,
  roundSeconds,
  active,
  onExpire,
}: {
  roundStartedAt: number;
  roundSeconds: number;
  active: boolean;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(roundSeconds);
  const firedFor = useRef<number>(-1);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      const left = roundSeconds - (Date.now() - roundStartedAt) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        if (firedFor.current !== roundStartedAt) {
          firedFor.current = roundStartedAt;
          onExpire();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roundStartedAt, roundSeconds, active, onExpire]);

  const pct = Math.max(0, Math.min(100, (remaining / roundSeconds) * 100));
  const low = remaining <= 5;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Time</span>
        <span
          className={cn(
            "font-mono tabular-nums",
            low ? "text-rose-400" : "text-foreground",
          )}
        >
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            low ? "bg-rose-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
