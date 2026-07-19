import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateUserOwnership } from "./authHelpers";

// ─── Save web push subscription ───────────────────────────────────────────────
export const savePushSubscription = mutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);

    // Upsert: check if endpoint already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isActive: true, userId: args.userId });
      return existing._id;
    }

    return ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
      isActive: true,
    });
  },
});

// ─── Remove push subscription (user opt-out) ─────────────────────────────────
export const removePushSubscription = mutation({
  args: { userId: v.id("users"), endpoint: v.string() },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (sub) await ctx.db.patch(sub._id, { isActive: false });
  },
});

// ─── Check if user has active push subscription ───────────────────────────────
export const hasPushSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return subs.some((s) => s.isActive);
  },
});

// ─── Exam Settings ────────────────────────────────────────────────────────────
export const getExamSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);
    return ctx.db
      .query("examSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const saveExamSettings = mutation({
  args: {
    userId: v.id("users"),
    examName: v.string(),
    examDate: v.string(),
    dailyCardGoal: v.number(),
  },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);

    const existing = await ctx.db
      .query("examSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        examName: args.examName,
        examDate: args.examDate,
        dailyCardGoal: args.dailyCardGoal,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("examSettings", {
      userId: args.userId,
      examName: args.examName,
      examDate: args.examDate,
      dailyCardGoal: args.dailyCardGoal,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Loot Box Claim ───────────────────────────────────────────────────────────
// Called after a qualifying session (≥ 20 cards). Returns a random reward.
// Reward tiers are weighted; better sessions (higher accuracy) → better chest.
export const claimLootBox = mutation({
  args: {
    userId: v.id("users"),
    sessionAccuracy: v.number(), // 0.0 – 1.0
    cardCount: v.number(),
  },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);

    if (args.cardCount < 20) throw new Error("Loot box requires ≥20 cards");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Determine chest tier by accuracy
    const tier =
      args.sessionAccuracy >= 0.9 ? "diamond"
      : args.sessionAccuracy >= 0.75 ? "gold"
      : args.sessionAccuracy >= 0.6 ? "silver"
      : "bronze";

    // Weighted reward tables per tier
    const rewardTables: Record<string, Array<{ type: string; value: number; label: string; weight: number }>> = {
      bronze:  [
        { type: "xp",     value: 25,  label: "+25 Bonus XP",      weight: 60 },
        { type: "shield", value: 1,   label: "1 Streak Shield",    weight: 30 },
        { type: "xp",     value: 50,  label: "+50 Bonus XP",       weight: 10 },
      ],
      silver:  [
        { type: "xp",     value: 50,  label: "+50 Bonus XP",       weight: 50 },
        { type: "shield", value: 1,   label: "1 Streak Shield",     weight: 30 },
        { type: "xp",     value: 100, label: "+100 Bonus XP",       weight: 20 },
      ],
      gold:    [
        { type: "xp",     value: 100, label: "+100 Bonus XP",       weight: 40 },
        { type: "shield", value: 2,   label: "2 Streak Shields",     weight: 35 },
        { type: "xp",     value: 200, label: "+200 Bonus XP",        weight: 25 },
      ],
      diamond: [
        { type: "xp",     value: 200, label: "+200 Bonus XP",        weight: 30 },
        { type: "shield", value: 2,   label: "2 Streak Shields",      weight: 30 },
        { type: "xp",     value: 500, label: "+500 Bonus XP",         weight: 40 },
      ],
    };

    const table = rewardTables[tier];

    // Weighted random pick
    const totalWeight = table.reduce((s, r) => s + r.weight, 0);
    let rand = Math.floor(Math.random() * totalWeight);
    let reward = table[0];
    for (const r of table) {
      rand -= r.weight;
      if (rand <= 0) { reward = r; break; }
    }

    // Apply reward
    if (reward.type === "xp") {
      await ctx.db.patch(args.userId, {
        xp: (user.xp ?? 0) + reward.value,
        weeklyXp: (user.weeklyXp ?? 0) + reward.value,
      });
    } else if (reward.type === "shield") {
      await ctx.db.patch(args.userId, {
        shields: Math.min(5, (user.shields ?? 0) + reward.value),
      });
    }

    return { tier, reward };
  },
});
