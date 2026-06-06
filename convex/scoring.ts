// Server-authoritative scoring + game constants. Pure functions, no Convex
// imports — the authoritative computation runs inside the Convex mutations;
// the client only ever displays the numbers the server returns.

export const TOTAL_ROUNDS = 10;
export const MAX_STRIKES = 3;
export const ROUND_SECONDS = 30;

export const BASE_POINTS = 1000;
export const TIME_BONUS_MAX = 500;

// Streak multiplier: +10% per consecutive correct answer (the count BEFORE this
// one), capped at +100%.
export const STREAK_BONUS_PER = 0.1;
export const STREAK_BONUS_CAP = 1.0;

export function computeRoundScore(args: {
  secondsRemaining: number;
  roundSeconds: number;
  /** Number of consecutive correct answers BEFORE this one (0 on first). */
  streakBefore: number;
}): number {
  const remaining = Math.max(0, Math.min(args.secondsRemaining, args.roundSeconds));
  const timeBonus = Math.round((remaining / args.roundSeconds) * TIME_BONUS_MAX);
  const subtotal = BASE_POINTS + timeBonus;
  const streakMultiplier =
    1 + Math.min(args.streakBefore * STREAK_BONUS_PER, STREAK_BONUS_CAP);
  return Math.round(subtotal * streakMultiplier);
}
