import { query } from "./_generated/server";
import { v } from "convex/values";

// ─── Student: retention overview ─────────────────────────────────────────────
export const getStudentStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalReviews = reviews.length;
    const correctReviews = reviews.filter((r) => r.wasCorrect).length;
    const accuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;

    // Calibration: avg confidence vs avg accuracy
    const avgConfidence =
      totalReviews > 0
        ? reviews.reduce((s, r) => s + r.confidence, 0) / totalReviews
        : 0;

    // Cards due today
    const now = Date.now();
    const dueToday = (await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.lte(q.field("nextReview"), now))
      .collect()).filter(s => !s.isArchived);

    // Reviews in last 7 days (by day)
    const sevenDaysAgo = now - 7 * 86_400_000;
    const recentReviews = reviews.filter((r) => r.reviewedAt >= sevenDaysAgo);

    const dailyActivity: Record<string, number> = {};
    for (const r of recentReviews) {
      const day = new Date(r.reviewedAt).toISOString().split("T")[0];
      dailyActivity[day] = (dailyActivity[day] ?? 0) + 1;
    }

    // Topic mastery (Bloom Status)
    // Get last 20 reviews to find active subtopics
    const last20Reviews = reviews.slice(-20);
    const cardIds = [...new Set(last20Reviews.map(r => r.cardId))];
    const cards = await Promise.all(cardIds.map(id => ctx.db.get(id)));
    
    // Create a map of cardId -> subtopicId
    const cardToSubtopic = new Map<string, string>();
    cards.forEach(c => {
      if (c && c.subtopicId) cardToSubtopic.set(c._id.toString(), c.subtopicId.toString());
    });

    const subtopicIds = [...new Set(Array.from(cardToSubtopic.values()))].slice(0, 5);
    
    const topicMastery = await Promise.all(subtopicIds.map(async (sid) => {
      const subtopic = await ctx.db.get(sid as any);
      if (!subtopic || !("name" in subtopic)) return null;
      
      const relevantReviews = reviews.filter(r => cardToSubtopic.get(r.cardId.toString()) === sid);
      if (relevantReviews.length === 0) return null;
      
      const acc = relevantReviews.filter(r => r.wasCorrect).length / relevantReviews.length;
      return {
        id: sid,
        name: subtopic.name as string,
        accuracy: Math.round(acc * 100),
        isBlooming: acc > 0.9 && relevantReviews.length > 5
      };
    }));

    return {
      totalReviews,
      accuracy: Math.round(accuracy * 100),
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      dueToday: dueToday.length,
      dailyActivity,
      topicMastery: topicMastery.filter((t): t is NonNullable<typeof t> => t !== null),
    };
  },
});

// ─── Calibration data (confidence vs accuracy by topic) ──────────────────────
export const getCalibrationData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Group by confidence level (1-5)
    const byConfidence: Record<number, { total: number; correct: number }> = {};
    for (const r of reviews) {
      const c = Math.round(r.confidence);
      if (!byConfidence[c]) byConfidence[c] = { total: 0, correct: 0 };
      byConfidence[c].total++;
      if (r.wasCorrect) byConfidence[c].correct++;
    }

    return Object.entries(byConfidence).map(([conf, data]) => ({
      confidence: Number(conf),
      accuracy: Math.round((data.correct / data.total) * 100),
      count: data.total,
    }));
  },
});

// ─── Memory Profiles (Adaptive Forgetting Curve) ─────────────────────────────
export const getUserMemoryProfiles = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("userMemoryProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Attach subject names
    const enriched = await Promise.all(
      profiles.map(async (p) => {
        if (!p.subjectId) return { ...p, subjectName: "Global Baseline" };
        const subject = await ctx.db.get(p.subjectId);
        return { ...p, subjectName: subject?.name ?? "Unknown Subject" };
      })
    );

    return enriched.sort((a, b) => b.totalDataPoints - a.totalDataPoints);
  },
});

// ─── Admin: platform-wide stats ───────────────────────────────────────────────
export const getAdminStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const cards = await ctx.db.query("cards").collect();

    const now = Date.now();
    const oneDayAgo = now - 86_400_000;

    const dau = new Set(
      reviews
        .filter((r) => r.reviewedAt >= oneDayAgo)
        .map((r) => r.userId.toString()),
    ).size;

    const publishedCards = cards.filter((c) => c.isPublished).length;
    const premiumUsers = users.filter((u) => u.tier === "premium").length;

    // Most failed cards (rated 1=Again)
    const failCounts: Record<string, number> = {};
    for (const r of reviews.filter((rv) => rv.rating === 1)) {
      const key = r.cardId.toString();
      failCounts[key] = (failCounts[key] ?? 0) + 1;
    }

    const topFailed = Object.entries(failCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cardId, count]) => ({ cardId, count }));

    return {
      totalUsers: users.length,
      premiumUsers,
      dau,
      totalReviews: reviews.length,
      publishedCards,
      topFailed,
    };
  },
});
