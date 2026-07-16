import { query } from "./_generated/server";
import { v } from "convex/values";
import { retrievability } from "./fsrs";

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

// ═══════════════════════════════════════════════════════════════════════════════
// NEW: Memory Profiling Analytics Queries
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Student: Memory Growth Timeline (from snapshots) ────────────────────────
export const getMemoryGrowthTimeline = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()), // 30, 60, or 90
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("memorySnapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by date ascending
    const sorted = snapshots.sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));

    // Limit to last N days if specified
    const limit = args.days ?? 90;
    const cutoffDate = new Date(Date.now() - limit * 86_400_000).toISOString().split("T")[0];
    const filtered = sorted.filter((s) => s.snapshotDate >= cutoffDate);

    return filtered.map((s) => ({
      date: s.snapshotDate,
      avgStability: Math.round(s.avgStability * 100) / 100,
      medianStability: Math.round(s.medianStability * 100) / 100,
      matureCards: s.matureCardCount,
      youngCards: s.youngCardCount,
      newCards: s.newCardCount,
      lapseRate: Math.round(s.lapseRate * 1000) / 10, // as percentage
      accuracy: Math.round(s.globalAccuracy * 1000) / 10,
      calibrationError: Math.round(s.calibrationError * 1000) / 10,
      avgResponseMs: Math.round(s.avgResponseMs),
      reviewsToday: s.reviewsToday,
      subjectBreakdown: s.subjectBreakdown,
    }));
  },
});

// ─── Student: Personal Forgetting Curve vs Baseline ──────────────────────────
export const getStudentForgettingCurve = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get active card states to compute average stability
    const cardStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeStates = cardStates.filter(
      (s) => !s.isArchived && s.reps > 0 && s.stability > 0
    );

    if (activeStates.length === 0) {
      return { hasData: false, curves: [], avgStability: 0, totalCards: 0 };
    }

    const avgStability =
      activeStates.reduce((sum, s) => sum + s.stability, 0) / activeStates.length;

    // Time points in days
    const timePoints = [0, 0.5, 1, 2, 3, 5, 7, 14, 21, 30, 45, 60, 90];

    const curves = timePoints.map((t) => {
      // Your brain on RecallIQ (using actual FSRS retrievability with your stability)
      const withSRS = t === 0 ? 100 : Math.round(retrievability(t, avgStability) * 1000) / 10;

      // Without SRS (Ebbinghaus baseline: rapid decay with half-life ~1.5 days)
      const withoutSRS = t === 0 ? 100 : Math.round(Math.exp(-t / 1.5) * 1000) / 10;

      return {
        day: t,
        label: t === 0 ? "Now" : t < 1 ? "12h" : `${t}d`,
        withSRS: Math.max(0, withSRS),
        withoutSRS: Math.max(0, withoutSRS),
      };
    });

    // Also get leech count for session insights
    const leechCount = activeStates.filter((s) => (s.lapses ?? 0) >= 5).length;

    // Response speed trend (last 50 reviews)
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const last50 = reviews.slice(-50);
    const avgResponseMs = last50.length > 0
      ? Math.round(last50.reduce((s, r) => s + r.responseMs, 0) / last50.length)
      : 0;

    // Calibration accuracy
    const calibrationError = last50.length > 0
      ? Math.round(
          (1 - last50.reduce((s, r) => s + Math.abs((r.confidence / 5) - (r.wasCorrect ? 1 : 0)), 0) / last50.length) * 100
        )
      : 0;

    return {
      hasData: true,
      curves,
      avgStability: Math.round(avgStability * 100) / 100,
      totalCards: activeStates.length,
      leechCount,
      avgResponseMs,
      calibrationAccuracy: calibrationError,
    };
  },
});

// ─── Admin: Advanced Platform Analytics ──────────────────────────────────────
export const getAdminAdvancedStats = query({
  handler: async (ctx) => {
    const now = Date.now();
    const users = await ctx.db.query("users").collect();

    // Get the most recent snapshot per user
    const latestSnapshots = [];
    for (const user of users) {
      const snaps = await ctx.db
        .query("memorySnapshots")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      if (snaps.length > 0) {
        const latest = snaps.sort((a, b) =>
          b.snapshotDate.localeCompare(a.snapshotDate)
        )[0];
        latestSnapshots.push(latest);
      }
    }

    // Platform-wide average Memory Half-Life
    const avgHalfLife =
      latestSnapshots.length > 0
        ? latestSnapshots.reduce((s, snap) => s + snap.avgStability, 0) / latestSnapshots.length
        : 0;

    // Platform-wide lapse rate (last 4 weeks of snapshots)
    const fourWeeksAgo = new Date(now - 28 * 86_400_000).toISOString().split("T")[0];
    const allRecentSnapshots = [];
    for (const user of users) {
      const snaps = await ctx.db
        .query("memorySnapshots")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      allRecentSnapshots.push(...snaps.filter((s) => s.snapshotDate >= fourWeeksAgo));
    }

    // Group by week
    const weeklyLapseRates: { week: string; rate: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now - (w + 1) * 7 * 86_400_000).toISOString().split("T")[0];
      const weekEnd = new Date(now - w * 7 * 86_400_000).toISOString().split("T")[0];
      const weekSnaps = allRecentSnapshots.filter(
        (s) => s.snapshotDate >= weekStart && s.snapshotDate < weekEnd
      );
      const avgRate = weekSnaps.length > 0
        ? weekSnaps.reduce((s, snap) => s + snap.lapseRate, 0) / weekSnaps.length
        : 0;
      weeklyLapseRates.push({
        week: `W-${w}`,
        rate: Math.round(avgRate * 1000) / 10,
      });
    }

    // Retention funnel: users active in 7/30/90 days
    const reviews = await ctx.db.query("reviews").collect();
    const sevenDays = new Set(reviews.filter((r) => r.reviewedAt >= now - 7 * 86_400_000).map((r) => r.userId.toString())).size;
    const thirtyDays = new Set(reviews.filter((r) => r.reviewedAt >= now - 30 * 86_400_000).map((r) => r.userId.toString())).size;
    const ninetyDays = new Set(reviews.filter((r) => r.reviewedAt >= now - 90 * 86_400_000).map((r) => r.userId.toString())).size;

    // Hardest subjects across the platform (from subject breakdowns)
    const subjectDifficulty: Record<string, { name: string; totalLapses: number; totalReviews: number; count: number }> = {};
    for (const snap of latestSnapshots) {
      if (!snap.subjectBreakdown || !Array.isArray(snap.subjectBreakdown)) continue;
      for (const sub of snap.subjectBreakdown as any[]) {
        if (!sub.subjectName || sub.subjectName === "Other") continue;
        const key = sub.subjectName;
        if (!subjectDifficulty[key]) {
          subjectDifficulty[key] = { name: key, totalLapses: 0, totalReviews: 0, count: 0 };
        }
        subjectDifficulty[key].totalLapses += (1 - (sub.accuracy ?? 1)) * (sub.cardCount ?? 0);
        subjectDifficulty[key].totalReviews += sub.cardCount ?? 0;
        subjectDifficulty[key].count++;
      }
    }

    const hardestSubjects = Object.values(subjectDifficulty)
      .map((s) => ({
        name: s.name,
        difficultyScore: s.totalReviews > 0 ? Math.round((s.totalLapses / s.totalReviews) * 100) : 0,
        studentCount: s.count,
      }))
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, 5);

    // Memory Half-Life trend (last 4 weeks)
    const weeklyHalfLife: { week: string; halfLife: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now - (w + 1) * 7 * 86_400_000).toISOString().split("T")[0];
      const weekEnd = new Date(now - w * 7 * 86_400_000).toISOString().split("T")[0];
      const weekSnaps = allRecentSnapshots.filter(
        (s) => s.snapshotDate >= weekStart && s.snapshotDate < weekEnd
      );
      const avgHL = weekSnaps.length > 0
        ? weekSnaps.reduce((s, snap) => s + snap.avgStability, 0) / weekSnaps.length
        : 0;
      weeklyHalfLife.push({
        week: `W-${w}`,
        halfLife: Math.round(avgHL * 100) / 100,
      });
    }

    return {
      avgHalfLife: Math.round(avgHalfLife * 100) / 100,
      weeklyHalfLife: weeklyHalfLife.reverse(),
      weeklyLapseRates: weeklyLapseRates.reverse(),
      retentionFunnel: {
        total: users.length,
        active7d: sevenDays,
        active30d: thirtyDays,
        active90d: ninetyDays,
      },
      hardestSubjects,
      snapshotCoverage: latestSnapshots.length,
    };
  },
});

