import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateAdmin, validateUserOwnership } from "./authHelpers";

// ─── Get or create user on first login ───────────────────────────────────────
export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) return existing;

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      tier: "free",
      streak: 0,
      lastActiveDate: undefined,
      totalReviews: 0,
      xp: 0,
      shields: 0,
      longestStreak: 0,
    });

    return ctx.db.get(userId);
  },
});

// ─── Get user by Clerk ID ─────────────────────────────────────────────────────
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// ─── Update subscription tier ─────────────────────────────────────────────────
export const updateTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("premium"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await validateAdmin(ctx);
    await ctx.db.patch(args.userId, { tier: args.tier });
  },
});

// ─── Update streak & last active ─────────────────────────────────────────────
export const recordActivity = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const today = new Date().toISOString().split("T")[0];
    if (user.lastActiveDate === today) return;

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    const missedYesterday = user.lastActiveDate !== yesterday && user.lastActiveDate !== today;

    // Shield consumption: missed yesterday but has a shield → preserve streak
    if (missedYesterday && user.streak > 0 && (user.shields ?? 0) > 0) {
      const newStreak = user.streak + 1;
      await ctx.db.patch(args.userId, {
        lastActiveDate: today,
        streak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak ?? 0),
        shields: (user.shields ?? 0) - 1,
      });
      return;
    }

    const newStreak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;

    await ctx.db.patch(args.userId, {
      lastActiveDate: today,
      streak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak ?? 0),
    });
  },
});

// ─── Award a streak shield ────────────────────────────────────────────────────
export const awardShield = mutation({
  args: { userId: v.id("users"), count: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { shields: Math.min(5, (user.shields ?? 0) + (args.count ?? 1)) });
  },
});

// ─── Use a streak shield manually ────────────────────────────────────────────
export const useShield = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if ((user.shields ?? 0) <= 0) throw new Error("No shields available");
    await ctx.db.patch(args.userId, { shields: (user.shields ?? 0) - 1 });
  },
});

// ─── Get top users for Leaderboard (XP Ranking) ─────────────────────────────
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const topUsers = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .order("desc")
      .take(20);

    return topUsers.map(user => ({
      _id: user._id,
      displayName: user.displayName,
      streak: user.streak,
      totalReviews: user.totalReviews,
      xp: user.xp,
    }));
  },
});

// ─── Anonymize user data on deletion (GDPR compliant soft-delete) ──────────
export const anonymizeUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      email: "[REDACTED]",
      displayName: "Deleted User",
      clerkId: "deleted_" + args.clerkId,
      streak: 0,
    });
  },
});
