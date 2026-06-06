"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import {
  CATEGORY_FILTERS,
  CATEGORY_FILTER_LABELS,
  type CategoryFilter,
} from "@/convex/categories";

export function StartPanel() {
  const router = useRouter();
  const startGame = useMutation(api.games.startGame);
  const [filter, setFilter] = useState<CategoryFilter>("mixed");
  const [loading, setLoading] = useState(false);

  async function play() {
    setLoading(true);
    try {
      const { sessionId } = await startGame({ categoryFilter: filter });
      router.push(`/play?session=${sessionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the game.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">Category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/60 hover:bg-muted",
              )}
            >
              {CATEGORY_FILTER_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={play} disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Play
      </Button>
    </div>
  );
}
