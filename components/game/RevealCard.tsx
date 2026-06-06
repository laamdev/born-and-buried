"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatYearRange, initials } from "@/lib/format";
import { CATEGORY_LABELS, type Category } from "@/convex/categories";

export type RevealData = {
  fullName: string;
  imageUrl: string;
  birthYear: number;
  deathYear: number;
  birthPlaceLabel: string;
  deathPlaceLabel: string;
  funFact: string;
  wikipediaUrl: string;
  primaryCategory: Category;
};

function Portrait({ src, name }: { src: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (errored || !src) {
    return (
      <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-semibold text-muted-foreground">
        {initials(name)}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      width={96}
      height={96}
      unoptimized
      className="size-24 shrink-0 rounded-lg object-cover"
      onError={() => setErrored(true)}
    />
  );
}

export function RevealCard({
  reveal,
  correct,
  timedOut,
  pointsAwarded,
  isGameOver,
  onNext,
}: {
  reveal: RevealData;
  correct: boolean;
  timedOut: boolean;
  pointsAwarded: number;
  isGameOver: boolean;
  onNext: () => void;
}) {
  return (
    <Card
      className={cn(
        "border-2",
        correct ? "border-emerald-500/50" : "border-rose-500/50",
      )}
    >
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {correct ? (
            <>
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span className="text-emerald-400">
                Correct! +{pointsAwarded.toLocaleString()} pts
              </span>
            </>
          ) : timedOut ? (
            <>
              <Clock className="size-5 text-rose-400" />
              <span className="text-rose-400">Time&apos;s up — strike</span>
            </>
          ) : (
            <>
              <XCircle className="size-5 text-rose-400" />
              <span className="text-rose-400">Wrong — strike</span>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <Portrait src={reveal.imageUrl} name={reveal.fullName} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold leading-tight">
                {reveal.fullName}
              </h2>
              <Badge variant="secondary">
                {CATEGORY_LABELS[reveal.primaryCategory]}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              {formatYearRange(reveal.birthYear, reveal.deathYear)}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-400">★</span> {reveal.birthPlaceLabel}
              <br />
              <span className="text-rose-400">✝</span> {reveal.deathPlaceLabel}
            </p>
          </div>
        </div>

        <p className="text-sm">{reveal.funFact}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={
              <Link href={reveal.wikipediaUrl} target="_blank" rel="noreferrer" />
            }
          >
            Wikipedia <ExternalLink className="size-3.5" />
          </Button>
          <Button onClick={onNext} autoFocus>
            {isGameOver ? "See results" : "Next round"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
