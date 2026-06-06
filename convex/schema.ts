import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Category validator — kept in sync with convex/categories.ts CATEGORIES.
const category = v.union(
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

const categoryFilter = v.union(category, v.literal("mixed"));

const difficulty = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
);

// A birth/death location + date. Year is signed so BCE works (e.g. -69).
// Year is required; month/day optional since many historical dates are partial.
const place = v.object({
  placeLabel: v.string(), // historical/display name shown to the player
  modernCountry: v.string(),
  city: v.string(),
  lat: v.number(),
  lng: v.number(),
  year: v.number(),
  month: v.optional(v.number()),
  day: v.optional(v.number()),
  circa: v.optional(v.boolean()),
});

export default defineSchema({
  figures: defineTable({
    slug: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    aliases: v.array(v.string()),
    primaryCategory: category,
    categories: v.array(category),
    difficulty,
    notability: v.number(), // 0–100, for combobox ranking + difficulty calibration
    birth: place,
    death: place, // required — the game needs a death location (deceased only)
    birthYear: v.number(), // denormalized for fast pin labels + filtering
    deathYear: v.number(),
    wikipediaUrl: v.string(),
    imageUrl: v.string(), // portrait (may fail to load → UI falls back to initials)
    funFact: v.string(),
    published: v.boolean(),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"])
    .index("by_published_notability", ["published", "notability"])
    .index("by_primaryCategory", ["primaryCategory"]),

  users: defineTable({
    clerkUserId: v.string(), // identity.subject
    displayName: v.string(),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk", ["clerkUserId"]),

  gameSessions: defineTable({
    userId: v.union(v.id("users"), v.null()), // null = guest
    answerFigureIds: v.array(v.id("figures")), // ordered, server-only (never sent sanitized)
    currentRound: v.number(),
    totalRounds: v.number(),
    score: v.number(),
    strikes: v.number(),
    streak: v.number(),
    categoryFilter,
    difficulty: v.optional(difficulty),
    roundSeconds: v.number(),
    roundStartedAt: v.number(), // ms epoch; basis for server-authoritative timing
    status: v.union(v.literal("active"), v.literal("finished")),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    savedToLeaderboard: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  scores: defineTable({
    userId: v.id("users"),
    sessionId: v.id("gameSessions"),
    score: v.number(),
    roundsCleared: v.number(),
    strikes: v.number(),
    accuracy: v.number(), // 0–1
    categoryFilter: v.string(),
    playedAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_user", ["userId"]),
});
