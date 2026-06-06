import { MapPin } from "lucide-react";
import { StartPanel } from "@/components/game/StartPanel";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="max-w-xl space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-emerald-400" /> Guess the figure from
          two places
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Born <span className="text-muted-foreground">&amp;</span> Buried
        </h1>
        <p className="text-muted-foreground">
          You get a world map with two pins — where a historical figure was{" "}
          <span className="text-emerald-400">born</span> and where they{" "}
          <span className="text-rose-400">died</span>, each with a year. Name who
          it is. 10 rounds, 3 strikes, one guess each.
        </p>
      </div>

      <StartPanel />
    </div>
  );
}
