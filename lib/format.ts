// Format a signed year for display, handling BCE and circa.
export function formatYear(year: number, circa?: boolean): string {
  const era = year < 0 ? `${Math.abs(year)} BCE` : `${year}`;
  return circa ? `c. ${era}` : era;
}

export function formatYearRange(
  birthYear: number,
  deathYear: number,
  birthCirca?: boolean,
  deathCirca?: boolean,
): string {
  return `${formatYear(birthYear, birthCirca)} – ${formatYear(deathYear, deathCirca)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
