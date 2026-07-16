import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const computeDailySnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const todayStr = new Date(now).toISOString().split("T")[0];

    // Load static catalogs once to construct subject mapping cache
    const subjects = await ctx.db.query("subjects").collect();
    const topics = await ctx.db.query("topics").collect();
    const subtopics = await ctx.db.query("subtopics").collect();

    const subjectNameMap = new Map<string, string>();
    subjects.forEach((s) => subjectNameMap.set(s._id.toString(), s.name));

    const topicToSubject = new Map<string, { id: string; name: string }>();
    topics.forEach((t) => {
      const name = subjectNameMap.get(t.subjectId.toString()) ?? "Unknown Subject";
      topicToSubject.set(t._id.toString(), { id: t.subjectId.toString(), name });
    });

    const subtopicToSubject = new Map<string, { id: string; name: string }>();
    subtopics.forEach((sub) => {
      const subObj = topicToSubject.get(sub.topicId.toString());
      if (subObj) {
        subtopicToSubject.set(sub._id.toString(), subObj);
      }
    });

    // Fetch all users on the platform
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      // Fetch global profile baseline
      let globalProfile = await ctx.db
        .query("userMemoryProfile")
        .withIndex("by_user_subject", (q) =>
          q.eq("userId", user._id).eq("subjectId", undefined)
        )
        .unique();

      if (!globalProfile) {
        // Create baseline profile if missing
        const globalProfileId = await ctx.db.insert("userMemoryProfile", {
          userId: user._id,
          retentionMultiplier: 1.0,
          learningSpeed: 1.0,
          targetRetention: 0.9,
          profileConfidence: 0,
          totalDataPoints: 0,
          recentAccuracy: 0,
          updatedAt: now,
        });
        globalProfile = await ctx.db.get(globalProfileId);
      }

      if (!globalProfile) continue;

      // Fetch user card states
      const cardStates = await ctx.db
        .query("userCardState")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const activeStates = cardStates.filter((s) => !s.isArchived);

      // Volume & state metrics
      const totalCardsStudied = activeStates.filter((s) => s.reps > 0).length;
      const matureCardCount = activeStates.filter((s) => s.stability > 21).length;
      const youngCardCount = activeStates.filter((s) => s.stability >= 1 && s.stability <= 21).length;
      const newCardCount = activeStates.filter((s) => s.state === "new" || s.reps === 0).length;

      // Stability array stats
      const stabilities = activeStates.map((s) => s.stability).sort((a, b) => a - b);
      const avgStability = stabilities.length > 0 ? stabilities.reduce((sum, s) => sum + s, 0) / stabilities.length : 0;
      
      let medianStability = 0;
      if (stabilities.length > 0) {
        const mid = Math.floor(stabilities.length / 2);
        medianStability = stabilities.length % 2 !== 0 ? stabilities[mid] : (stabilities[mid - 1] + stabilities[mid]) / 2;
      }
      
      const p90Idx = Math.floor(stabilities.length * 0.9);
      const p90Stability = stabilities.length > 0 ? stabilities[p90Idx] : 0;

      // Fetch reviews
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const totalReviewsLifetime = reviews.length;
      const reviewsToday = reviews.filter((r) => r.reviewedAt >= oneDayAgo).length;

      // Response Speed & Calibration Error (rolling proxy over last 100 reviews)
      const last100Reviews = reviews.slice(-100);
      const avgResponseMs = last100Reviews.length > 0 
        ? last100Reviews.reduce((sum, r) => sum + r.responseMs, 0) / last100Reviews.length
        : 0;

      const calibrationError = last100Reviews.length > 0
        ? last100Reviews.reduce((sum, r) => sum + Math.abs((r.confidence / 5.0) - (r.wasCorrect ? 1.0 : 0.0)), 0) / last100Reviews.length
        : 0;

      // Global accuracy & lapse rates (last 7 days)
      const recentReviews = reviews.filter((r) => r.reviewedAt >= sevenDaysAgo);
      const correctReviews = recentReviews.filter((r) => r.wasCorrect).length;
      const globalAccuracy = recentReviews.length > 0 ? correctReviews / recentReviews.length : 0;

      const lapses = recentReviews.filter((r) => r.rating === 1).length;
      const lapseRate = recentReviews.length > 0 ? lapses / recentReviews.length : 0;

      // Subject breakdown stats
      const subjectGroups: Record<string, { stabilities: number[]; correct: number; total: number; cardCount: number }> = {};

      for (const state of activeStates) {
        const card = await ctx.db.get(state.cardId);
        if (!card) continue;

        const subId = card.subtopicId ? card.subtopicId.toString() : "";
        const subjectMeta = subtopicToSubject.get(subId);
        const subjId = subjectMeta ? subjectMeta.id : (card.subjectId ? card.subjectId.toString() : "global");
        const name = subjectMeta ? subjectMeta.name : (card.subjectId ? (subjectNameMap.get(card.subjectId.toString()) ?? "Other") : "Other");

        if (!subjectGroups[subjId]) {
          subjectGroups[subjId] = { stabilities: [], correct: 0, total: 0, cardCount: 0 };
        }

        subjectGroups[subjId].stabilities.push(state.stability);
        subjectGroups[subjId].cardCount++;
      }

      // Group reviews by subject
      for (const review of reviews) {
        const card = await ctx.db.get(review.cardId);
        if (!card) continue;

        const subId = card.subtopicId ? card.subtopicId.toString() : "";
        const subjectMeta = subtopicToSubject.get(subId);
        const subjId = subjectMeta ? subjectMeta.id : (card.subjectId ? card.subjectId.toString() : "global");

        if (subjectGroups[subjId]) {
          subjectGroups[subjId].total++;
          if (review.wasCorrect) subjectGroups[subjId].correct++;
        }
      }

      const subjectBreakdown = await Promise.all(
        Object.entries(subjectGroups).map(async ([subjId, data]) => {
          const subjectName = subjectNameMap.get(subjId) ?? "Other";
          
          const sAvg = data.stabilities.length > 0 ? data.stabilities.reduce((a, b) => a + b, 0) / data.stabilities.length : 0;
          const sAcc = data.total > 0 ? data.correct / data.total : 1.0;
          const matureCount = data.stabilities.filter((s) => s > 21).length;
          const matureRatio = data.cardCount > 0 ? matureCount / data.cardCount : 0;

          // Fetch subject-specific memory profile to read retention multiplier
          const subjIdObj = subjId !== "global" ? (subjId as Id<"subjects">) : undefined;
          const subjProfile = await ctx.db
            .query("userMemoryProfile")
            .withIndex("by_user_subject", (q) =>
              q.eq("userId", user._id).eq("subjectId", subjIdObj)
            )
            .unique();

          return {
            subjectId: subjId !== "global" ? subjId : undefined,
            subjectName,
            avgStability: sAvg,
            accuracy: sAcc,
            cardCount: data.cardCount,
            retentionMultiplier: subjProfile ? subjProfile.retentionMultiplier : 1.0,
            matureRatio,
          };
        })
      );

      // Clean existing snapshot for today to prevent duplicates on manual re-runs
      const existingToday = await ctx.db
        .query("memorySnapshots")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", user._id).eq("snapshotDate", todayStr)
        )
        .unique();

      const snapshotPayload = {
        userId: user._id,
        snapshotDate: todayStr,
        globalRetentionMultiplier: globalProfile.retentionMultiplier,
        globalLearningSpeed: globalProfile.learningSpeed,
        globalAccuracy,
        totalCardsStudied,
        totalReviewsLifetime,
        reviewsToday,
        avgStability,
        medianStability,
        p90Stability,
        matureCardCount,
        youngCardCount,
        newCardCount,
        lapseRate,
        subjectBreakdown,
        avgResponseMs,
        calibrationError,
      };

      if (existingToday) {
        await ctx.db.patch(existingToday._id, snapshotPayload);
      } else {
        await ctx.db.insert("memorySnapshots", snapshotPayload);
      }
    }
  },
});
