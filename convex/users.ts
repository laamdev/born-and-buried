import { query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { UserIdentity } from "convex/server";

// Shared helper (NOT a Convex function): find-or-create the app user for a
// verified Clerk identity. The Clerk `subject` is the stable unique id; we
// never trust a client-supplied userId.
export async function upsertUser(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  const displayName =
    identity.name ??
    identity.nickname ??
    identity.givenName ??
    (identity.email ? identity.email.split("@")[0] : undefined) ??
    "Player";
  const imageUrl = identity.pictureUrl ?? undefined;

  if (existing) {
    if (existing.displayName !== displayName || existing.imageUrl !== imageUrl) {
      await ctx.db.patch(existing._id, { displayName, imageUrl });
    }
    return (await ctx.db.get(existing._id))!;
  }

  const id = await ctx.db.insert("users", { clerkUserId: identity.subject, displayName, imageUrl });
  return (await ctx.db.get(id))!;
}

// Current signed-in user's profile, or null when signed out.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
  },
});
