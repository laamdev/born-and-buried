import { internalMutation } from "./_generated/server";
import { SEED_FIGURES } from "./seedData";

// Idempotent seed: inserts any seed figure whose slug isn't already present,
// published and ready to play. Run with: npx convex run seed:run
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (const f of SEED_FIGURES) {
      const existing = await ctx.db
        .query("figures")
        .withIndex("by_slug", (q) => q.eq("slug", f.slug))
        .unique();
      if (existing) continue;

      await ctx.db.insert("figures", {
        ...f,
        birthYear: f.birth.year,
        deathYear: f.death.year,
        published: true,
      });
      inserted++;
    }
    return { inserted, total: SEED_FIGURES.length };
  },
});
