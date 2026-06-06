import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { upsertUser } from "./users";

// ---------------------------------------------------------------------------
// Save a finished game to the leaderboard. AUTH-GATED: requires a verified
// Clerk identity — we never accept a client-supplied userId. Idempotent so a
// guest can finish, then sign in, then save the same session exactly once.
// ---------------------------------------------------------------------------
export const submitScore = mutation({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Game session not found.");
    if (session.status !== "finished") throw new Error("Game is not finished yet.");
    if (session.savedToLeaderboard) return { saved: true, alreadySaved: true };

    const user = await upsertUser(ctx, identity);

    // Each advanced round was either correct or a strike (wrong/timeout).
    const roundsPlayed = session.currentRound;
    const roundsCleared = Math.max(0, roundsPlayed - session.strikes);
    const accuracy = roundsPlayed > 0 ? roundsCleared / roundsPlayed : 0;

    await ctx.db.insert("scores", {
      userId: user._id,
      sessionId: session._id,
      score: session.score,
      roundsCleared,
      strikes: session.strikes,
      accuracy,
      categoryFilter: String(session.categoryFilter),
      playedAt: session.finishedAt ?? Date.now(),
    });

    await ctx.db.patch(session._id, { savedToLeaderboard: true, userId: user._id });

    return { saved: true, alreadySaved: false };
  },
});

// Top scores for the public leaderboard, joined to user display info.
export const topScores = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, 100);
    const rows = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(limit);

    return Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          score: row.score,
          roundsCleared: row.roundsCleared,
          strikes: row.strikes,
          accuracy: row.accuracy,
          categoryFilter: row.categoryFilter,
          playedAt: row.playedAt,
          displayName: user?.displayName ?? "Player",
          imageUrl: user?.imageUrl ?? null,
        };
      }),
    );
  },
});

// Current user's recent scores (auth-gated; empty when signed out).
export const myHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];

    const rows = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(Math.min(args.limit ?? 20, 100));

    return rows.map((row) => ({
      _id: row._id,
      score: row.score,
      roundsCleared: row.roundsCleared,
      strikes: row.strikes,
      accuracy: row.accuracy,
      categoryFilter: row.categoryFilter,
      playedAt: row.playedAt,
    }));
  },
});
