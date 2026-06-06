// Shared category source of truth. Plain TS (no Convex imports) so it can be
// imported from both the Convex backend and the React client.

export const CATEGORIES = [
  "politics",
  "science",
  "art",
  "music",
  "literature",
  "film",
  "military",
  "exploration",
  "sports",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  politics: "Politics",
  science: "Science",
  art: "Art",
  music: "Music",
  literature: "Literature",
  film: "Film",
  military: "Military",
  exploration: "Exploration",
  sports: "Sports",
};

// "mixed" = all categories. Used by the start screen filter + game session.
export const CATEGORY_FILTERS = ["mixed", ...CATEGORIES] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const CATEGORY_FILTER_LABELS: Record<CategoryFilter, string> = {
  mixed: "Mixed (all)",
  ...CATEGORY_LABELS,
};
