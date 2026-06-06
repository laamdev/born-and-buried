import { cn } from "@/lib/utils";
import { formatYear } from "@/lib/format";

// The visual for a single map marker: a year badge above a teardrop pin.
// Birth = emerald, death = rose.
export function PinLabel({
  kind,
  year,
  circa,
}: {
  kind: "birth" | "death";
  year: number;
  circa?: boolean;
}) {
  const isBirth = kind === "birth";
  return (
    <div className="flex -translate-y-1 flex-col items-center gap-0.5">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold shadow-md ring-1 backdrop-blur",
          isBirth
            ? "bg-emerald-500/90 text-emerald-950 ring-emerald-300/50"
            : "bg-rose-500/90 text-rose-950 ring-rose-300/50",
        )}
      >
        {isBirth ? "★ " : "✝ "}
        {formatYear(year, circa)}
      </span>
      <span
        className={cn(
          "size-3 rotate-45 rounded-[2px] shadow ring-2 ring-background",
          isBirth ? "bg-emerald-400" : "bg-rose-400",
        )}
        aria-hidden
      />
    </div>
  );
}
