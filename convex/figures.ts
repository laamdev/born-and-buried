import { query } from "./_generated/server";

// Combobox source. Returns ONLY names + aliases + ranking — NEVER geography or
// years. The client knows every figure's name+id (needed to submit a guess),
// but with no coordinates it still can't tell which one is the current answer.
export const listForCombobox = query({
  args: {},
  handler: async (ctx) => {
    const figures = await ctx.db
      .query("figures")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    return figures
      .map((f) => ({
        _id: f._id,
        fullName: f.fullName,
        aliases: f.aliases,
        notability: f.notability,
      }))
      .sort((a, b) => b.notability - a.notability);
  },
});
