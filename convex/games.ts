import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { upsertUser } from "./users";
import {
  MAX_STRIKES,
  ROUND_SECONDS,
  TOTAL_ROUNDS,
  computeRoundScore,
} from "./scoring";

const categoryFilter = v.union(
  v.literal("mixed"),
  v.literal("politics"),
  v.literal("science"),
  v.literal("art"),
  v.literal("music"),
  v.literal("literature"),
  v.literal("film"),
  v.literal("military"),
  v.literal("exploration"),
  v.literal("sports"),
);

const difficulty = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
);

// ---------------------------------------------------------------------------
// Start a game: pick random distinct published figures matching the filter,
// store the ordered answer list server-side, attach the user if authenticated.
// ---------------------------------------------------------------------------
export const startGame = mutation({
  args: { categoryFilter, difficulty: v.optional(difficulty) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let userId: Doc<"users">["_id"] | null = null;
    if (identity) {
      const user = await upsertUser(ctx, identity);
      userId = user._id;
    }

    const published = await ctx.db
      .query("figures")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    const pool = published.filter((f) => {
      const matchesCategory =
        args.categoryFilter === "mixed" ||
        f.primaryCategory === args.categoryFilter ||
        f.categories.includes(args.categoryFilter);
      const matchesDifficulty = !args.difficulty || f.difficulty === args.difficulty;
      return matchesCategory && matchesDifficulty;
    });

    if (pool.length === 0) {
      throw new Error("No figures available for that filter.");
    }

    // Fisher–Yates shuffle (Math.random is allowed inside Convex functions).
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const totalRounds = Math.min(TOTAL_ROUNDS, pool.length);
    const picked = pool.slice(0, totalRounds);
    const now = Date.now();

    const sessionId = await ctx.db.insert("gameSessions", {
      userId,
      answerFigureIds: picked.map((f) => f._id),
      currentRound: 0,
      totalRounds,
      score: 0,
      strikes: 0,
      streak: 0,
      categoryFilter: args.categoryFilter,
      difficulty: args.difficulty,
      roundSeconds: ROUND_SECONDS,
      roundStartedAt: now,
      status: "active",
      startedAt: now,
    });

    return { sessionId, totalRounds };
  },
});

// ---------------------------------------------------------------------------
// Sanitized current-round payload. Reactive (query) → drives HUD + map.
// Deliberately omits the answer figure's name, id, image, and fun fact.
// ---------------------------------------------------------------------------
export const getCurrentRound = query({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const base = {
      status: session.status,
      roundIndex: session.currentRound,
      totalRounds: session.totalRounds,
      score: session.score,
      strikes: session.strikes,
      streak: session.streak,
      maxStrikes: MAX_STRIKES,
      roundSeconds: session.roundSeconds,
      roundStartedAt: session.roundStartedAt,
      categoryFilter: session.categoryFilter,
      finishedAt: session.finishedAt ?? null,
    };

    if (session.status === "finished" || session.currentRound >= session.totalRounds) {
      return { ...base, status: "finished" as const, round: null };
    }

    const answer = await ctx.db.get(session.answerFigureIds[session.currentRound]);
    if (!answer) return { ...base, round: null };

    return {
      ...base,
      round: {
        category: answer.primaryCategory,
        birth: {
          lat: answer.birth.lat,
          lng: answer.birth.lng,
          year: answer.birth.year,
          placeLabel: answer.birth.placeLabel,
          circa: answer.birth.circa ?? false,
        },
        death: {
          lat: answer.death.lat,
          lng: answer.death.lng,
          year: answer.death.year,
          placeLabel: answer.death.placeLabel,
          circa: answer.death.circa ?? false,
        },
      },
    };
  },
});

// Resolve the current round, patch the session, return the reveal payload.
async function finalizeRound(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  opts: { correct: boolean; secondsRemaining: number; timedOut: boolean },
) {
  const answer = await ctx.db.get(session.answerFigureIds[session.currentRound]);
  if (!answer) throw new Error("Round answer missing.");

  const now = Date.now();
  let { score, strikes, streak } = session;
  let pointsAwarded = 0;

  if (opts.correct) {
    pointsAwarded = computeRoundScore({
      secondsRemaining: opts.secondsRemaining,
      roundSeconds: session.roundSeconds,
      streakBefore: streak,
    });
    score += pointsAwarded;
    streak += 1;
  } else {
    strikes += 1;
    streak = 0;
  }

  const currentRound = session.currentRound + 1;
  const isGameOver = strikes >= MAX_STRIKES || currentRound >= session.totalRounds;

  await ctx.db.patch(session._id, {
    score,
    strikes,
    streak,
    currentRound,
    roundStartedAt: now, // next round starts now
    status: isGameOver ? "finished" : "active",
    ...(isGameOver ? { finishedAt: now } : {}),
  });

  return {
    correct: opts.correct,
    timedOut: opts.timedOut,
    pointsAwarded,
    newScore: score,
    newStrikes: strikes,
    newStreak: streak,
    isGameOver,
    reveal: {
      fullName: answer.fullName,
      imageUrl: answer.imageUrl,
      birthYear: answer.birth.year,
      deathYear: answer.death.year,
      birthPlaceLabel: answer.birth.placeLabel,
      deathPlaceLabel: answer.death.placeLabel,
      funFact: answer.funFact,
      wikipediaUrl: answer.wikipediaUrl,
      primaryCategory: answer.primaryCategory,
    },
  };
}

// ---------------------------------------------------------------------------
// Submit a guess. Server-authoritative: it computes elapsed time itself (so a
// spoofed client clock can't earn a bigger time bonus or dodge a timeout) and
// compares the guess against the stored answer the client never received.
// ---------------------------------------------------------------------------
export const submitGuess = mutation({
  args: { sessionId: v.id("gameSessions"), guessFigureId: v.id("figures") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Game session not found.");
    if (session.status !== "active") throw new Error("This game is already over.");

    const now = Date.now();
    const elapsedMs = now - session.roundStartedAt;
    const timedOut = elapsedMs > session.roundSeconds * 1000;
    const secondsRemaining = session.roundSeconds - elapsedMs / 1000;
    const answerId = session.answerFigureIds[session.currentRound];
    const correct = !timedOut && args.guessFigureId === answerId;

    return finalizeRound(ctx, session, {
      correct,
      secondsRemaining: timedOut ? 0 : secondsRemaining,
      timedOut,
    });
  },
});

// ---------------------------------------------------------------------------
// Round timer expired on the client. Server re-verifies the elapsed time before
// recording the timeout strike, so it can't be triggered early.
// ---------------------------------------------------------------------------
export const submitTimeout = mutation({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Game session not found.");
    if (session.status !== "active") throw new Error("This game is already over.");

    const elapsedMs = Date.now() - session.roundStartedAt;
    // ~750ms tolerance for client/network skew before we trust the timeout.
    if (elapsedMs < session.roundSeconds * 1000 - 750) {
      return { tooEarly: true as const };
    }

    return finalizeRound(ctx, session, { correct: false, secondsRemaining: 0, timedOut: true });
  },
});
