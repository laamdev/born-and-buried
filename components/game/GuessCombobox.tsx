"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type FigureOption = {
  _id: string;
  fullName: string;
  aliases: string[];
  notability: number;
};

// One guess per round: selecting an item immediately commits the guess.
// Search matches fullName + aliases; the list is pre-ranked by notability.
export function GuessCombobox({
  figures,
  disabled,
  onGuess,
}: {
  figures: FigureOption[];
  disabled?: boolean;
  onGuess: (figureId: string) => void;
}) {
  const [value, setValue] = useState<FigureOption | null>(null);

  return (
    <Combobox
      items={figures}
      value={value}
      disabled={disabled}
      itemToStringValue={(f: FigureOption) =>
        `${f.fullName} ${f.aliases.join(" ")}`
      }
      onValueChange={(next: FigureOption | null) => {
        setValue(next);
        if (next) onGuess(next._id);
      }}
    >
      <ComboboxInput
        placeholder="Who is it? Search by name…"
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>No matching figure.</ComboboxEmpty>
        <ComboboxList>
          {(f: FigureOption) => (
            <ComboboxItem key={f._id} value={f}>
              {f.fullName}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
