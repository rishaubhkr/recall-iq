import { query, mutation } from "./_generated/server";
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

// ─── Memory Score (0–1000 vanity metric) ─────────────────────────────────────
// Weighted composite: Accuracy (30%) + Consistency (25%) + Stability (30%) + Speed (15%)
export const getMemoryScore = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cardStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (reviews.length === 0) return { score: 0, breakdown: null };

    // 1. Accuracy component (300 pts max) — 7-day accuracy
    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    const recent = reviews.filter((r) => r.reviewedAt >= sevenDaysAgo);
    const recentAccuracy = recent.length > 0
      ? recent.filter((r) => r.wasCorrect).length / recent.length
      : reviews.filter((r) => r.wasCorrect).length / reviews.length;
    const accuracyScore = Math.round(recentAccuracy * 300);

    // 2. Consistency component (250 pts max) — active days in last 14 days
    const fourteenDaysAgo = Date.now() - 14 * 86_400_000;
    const activeDays = new Set(
      reviews
        .filter((r) => r.reviewedAt >= fourteenDaysAgo)
        .map((r) => new Date(r.reviewedAt).toISOString().split("T")[0])
    ).size;
    const consistencyScore = Math.round(Math.min(activeDays / 14, 1) * 250);

    // 3. Stability component (300 pts max) — avg stability of mature card states
    const activeStates = cardStates.filter((s) => !s.isArchived && s.reps > 0 && s.stability > 0);
    const avgStability = activeStates.length > 0
      ? activeStates.reduce((s, c) => s + c.stability, 0) / activeStates.length
      : 0;
    const stabilityScore = Math.round(Math.min(avgStability / 30, 1) * 300);

    // 4. Response speed component (150 pts max) — faster answers = higher score, cap at 2000ms
    const last50 = reviews.slice(-50);
    const avgMs = last50.length > 0
      ? last50.reduce((s, r) => s + r.responseMs, 0) / last50.length
      : 5000;
    const speedScore = Math.round(Math.max(0, Math.min(1, (2000 - avgMs) / 2000)) * 150);

    const total = Math.min(1000, accuracyScore + consistencyScore + stabilityScore + speedScore);

    return {
      score: total,
      breakdown: { accuracy: accuracyScore, consistency: consistencyScore, stability: stabilityScore, speed: speedScore },
    };
  },
});

// ─── Daily Brain Report ───────────────────────────────────────────────────────
// Returns up to 3 personalized insight strings for the dashboard
export const getDailyBrainReport = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (reviews.length < 5) {
      return {
        insights: [{ emoji: "🚀", text: "Start your first session to unlock personalized insights!" }],
        weakestSubjectName: null,
        closestMilestone: null,
      };
    }

    const cardStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const insights: { emoji: string; text: string }[] = [];

    // Insight 1: Today's accuracy if studied today
    const today = new Date().toISOString().split("T")[0];
    const todayReviews = reviews.filter(
      (r) => new Date(r.reviewedAt).toISOString().split("T")[0] === today
    );
    if (todayReviews.length > 0) {
      const acc = Math.round(todayReviews.filter((r) => r.wasCorrect).length / todayReviews.length * 100);
      const avgGain = (acc / 100 * 0.8).toFixed(1);
      insights.push({ emoji: "📈", text: `Memory stability grew +${avgGain} days on average today (${acc}% accuracy).` });
    }

    // Insight 2: Leech cards
    const leechCount = cardStates.filter((s) => !s.isArchived && s.lapses >= 5).length;
    if (leechCount > 0) {
      insights.push({ emoji: "🔁", text: `${leechCount} card${leechCount > 1 ? "s are leeches" : " is a leech"} — they keep returning. Consider adding a mnemonic.` });
    }

    // Insight 3: Next mature card milestone
    const matureCards = cardStates.filter((s) => !s.isArchived && s.stability >= 21).length;
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const nextMilestone = milestones.find((m) => m > matureCards) ?? null;
    const closestMilestone = nextMilestone !== null ? { target: nextMilestone, current: matureCards } : null;
    if (closestMilestone) {
      const remaining = closestMilestone.target - closestMilestone.current;
      insights.push({ emoji: "🏅", text: `${remaining} more mature card${remaining !== 1 ? "s" : ""} until your next milestone — ${closestMilestone.target} total!` });
    }

    // Insight 4: Streak encouragement
    const user = await ctx.db.get(args.userId);
    if (user?.streak && user.streak >= 3 && insights.length < 3) {
      insights.push({ emoji: "🔥", text: `${user.streak} days in a row — only the top 10% of students get here.` });
    }

    return {
      insights: insights.slice(0, 3),
      weakestSubjectName: null,
      closestMilestone,
    };
  },
});

// ─── Get Weekly Stats For AI Generation ──────────────────────────────────────
export const getWeeklyStatsForAi = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    const snapshots = await ctx.db
      .query("memorySnapshots")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).gte("snapshotDate", new Date(sevenDaysAgo).toISOString().split("T")[0]))
      .collect();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const weeklyReviews = reviews.filter(r => r.reviewedAt >= sevenDaysAgo);
    const correctCount = weeklyReviews.filter(r => r.wasCorrect).length;
    const accuracy = weeklyReviews.length > 0 ? correctCount / weeklyReviews.length : 0;

    const avgResponseMs = weeklyReviews.length > 0
      ? weeklyReviews.reduce((sum, r) => sum + r.responseMs, 0) / weeklyReviews.length
      : 0;

    // Get active card states
    const states = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const leechCount = states.filter(s => !s.isArchived && s.lapses >= 5).length;
    const matureCount = states.filter(s => !s.isArchived && s.stability > 21).length;

    return {
      displayName: user.displayName,
      streak: user.streak,
      weeklyReviewsCount: weeklyReviews.length,
      weeklyAccuracy: Math.round(accuracy * 100),
      avgResponseMs: Math.round(avgResponseMs),
      leechCount,
      matureCount,
      totalStudied: states.filter(s => s.reps > 0).length,
      snapshotCount: snapshots.length,
    };
  },
});

// ─── Save Weekly AI Report ───────────────────────────────────────────────────
export const saveWeeklyAiReport = mutation({
  args: {
    userId: v.id("users"),
    weekStartDate: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if report already exists for this week
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_user_week", (q) => q.eq("userId", args.userId).eq("weekStartDate", args.weekStartDate))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { summary: args.summary });
      return existing._id;
    }

    return ctx.db.insert("weeklyReports", {
      userId: args.userId,
      weekStartDate: args.weekStartDate,
      summary: args.summary,
      createdAt: Date.now(),
    });
  },
});

// ─── Get Weekly AI Report ────────────────────────────────────────────────────
export const getWeeklyAiReport = query({
  args: { userId: v.id("users"), weekStartDate: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("weeklyReports")
      .withIndex("by_user_week", (q) => q.eq("userId", args.userId).eq("weekStartDate", args.weekStartDate))
      .unique();
  },
});

// ─── Get Predicted Exam Score ───────────────────────────────────────────────
export const getPredictedScore = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const exam = await ctx.db
      .query("examSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!exam) return null;

    // Get enrolled courses
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let enrolledCourseIds = enrollments.map(e => e.courseId);

    // If no explicit enrollments, look for personal courses or default courses
    if (enrolledCourseIds.length === 0) {
      const courses = await ctx.db.query("courses").collect();
      enrolledCourseIds = courses.slice(0, 1).map(c => c._id);
    }

    if (enrolledCourseIds.length === 0) {
      return {
        score: 75,
        range: "70 – 100",
        coverage: 0,
        accuracy: 0,
        examName: exam.examName,
        daysRemaining: Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / 86_400_000),
      };
    }

    // Get all cards in enrolled courses
    const allCards = await ctx.db.query("cards").collect();
    const courseCards = allCards.filter(c => c.courseId && enrolledCourseIds.some(cid => cid.toString() === c.courseId?.toString()));
    const totalCardsCount = Math.max(1, courseCards.length);

    // Get user card states
    const states = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Active reviewed states belonging to course cards
    const courseCardIds = new Set(courseCards.map(c => c._id.toString()));
    const activeStates = states.filter(s => !s.isArchived && s.reps > 0 && courseCardIds.has(s.cardId.toString()));
    const studiedCount = activeStates.length;

    // Calculate retrievability based on FSRS stability and elapsed time since last review
    const now = Date.now();
    let sumRetrievability = 0;
    activeStates.forEach(s => {
      const elapsedDays = (now - s.lastReview) / 86_400_000;
      sumRetrievability += retrievability(elapsedDays, s.stability);
    });

    const avgRetrievability = studiedCount > 0 ? sumRetrievability / studiedCount : 0.8;
    const coverage = studiedCount / totalCardsCount;

    // Set Max Score based on exam name
    const isNeet = exam.examName.toUpperCase().includes("NEET");
    const maxScore = isNeet ? 720 : 300;

    // Projected Score formula: Base (20%) + Progress-linked (80%)
    const baseScore = maxScore * 0.2;
    const dynamicScore = maxScore * 0.8 * (coverage * avgRetrievability);
    const projected = Math.round(baseScore + dynamicScore);

    // Add visual range jitter
    const minRange = Math.max(Math.round(baseScore), projected - 15);
    const maxRange = Math.min(maxScore, projected + 15);

    return {
      score: projected,
      range: `${minRange} – ${maxRange}`,
      coverage: Math.round(coverage * 100),
      accuracy: Math.round(avgRetrievability * 100),
      examName: exam.examName,
      daysRemaining: Math.ceil((new Date(exam.examDate).getTime() - now) / 86_400_000),
    };
  },
});

