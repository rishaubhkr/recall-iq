import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { retrievability, schedule, newCardState, type Rating } from "./fsrs";
import { validateUserOwnership } from "./authHelpers";

// ─── Record a review and update FSRS state ───────────────────────────────────
export const recordReview = mutation({
  args: {
    sessionId: v.id("sessions"),
    cardId: v.id("cards"),
    userId: v.id("users"),
    rating: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
    confidence: v.number(),
    wasCorrect: v.boolean(),
    responseMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    const now = Date.now();

    // Get the card to find its subject
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");

    // Fetch or create user memory profile for this subject (if applicable)
    let profile = null;
    if (card.subtopicId) {
      const subtopic = await ctx.db.get(card.subtopicId);
      if (subtopic) {
        const topic = await ctx.db.get(subtopic.topicId);
        if (topic) {
          profile = await ctx.db
            .query("userMemoryProfile")
            .withIndex("by_user_subject", (q) =>
              q.eq("userId", args.userId).eq("subjectId", topic.subjectId)
            )
            .unique();
        }
      }
    }

    if (!profile) {
      // Fallback to global profile if no subject profile exists, or create new
      profile = await ctx.db
        .query("userMemoryProfile")
        .withIndex("by_user_subject", (q) =>
          q.eq("userId", args.userId).eq("subjectId", undefined)
        )
        .unique();

      if (!profile) {
        const profileId = await ctx.db.insert("userMemoryProfile", {
          userId: args.userId,
          retentionMultiplier: 1.0,
          learningSpeed: 1.0,
          targetRetention: 0.9,
          profileConfidence: 0,
          totalDataPoints: 0,
          recentAccuracy: 0,
          updatedAt: now,
        });
        profile = await ctx.db.get(profileId);
      }
    }

    // Get or create FSRS state for this user/card pair
    const existing = await ctx.db
      .query("userCardState")
      .withIndex("by_user_card", (q) =>
        q.eq("userId", args.userId).eq("cardId", args.cardId),
      )
      .unique();

    // Fetch session context for session position and fatigue tracking
    const session = await ctx.db.get(args.sessionId);
    const positionInSession = session ? session.completedCardIds.length + 1 : 1;

    // Calculate memory profile metrics at review time
    const stabilityAtReview = existing ? existing.stability : 0;
    const elapsedDays = existing ? (now - existing.lastReview) / 86_400_000 : 0;
    const predictedRecall = existing ? retrievability(elapsedDays, existing.stability) : 1.0;
    const timeOfDay = new Date(now).getUTCHours();

    // Log the review with detailed memory metrics
    await ctx.db.insert("reviews", {
      sessionId: args.sessionId,
      cardId: args.cardId,
      userId: args.userId,
      rating: args.rating as Rating,
      confidence: args.confidence,
      wasCorrect: args.wasCorrect,
      responseMs: args.responseMs,
      reviewedAt: now,
      stabilityAtReview,
      predictedRecall,
      elapsedDays,
      positionInSession,
      timeOfDay,
    });

    let error = 0;

    if (existing) {
      const expectedRecall = retrievability(elapsedDays, existing.stability);
      const actualRecall = args.wasCorrect ? 1.0 : 0.0;
      error = actualRecall - expectedRecall;

      // Update profile
      if (profile) {
        const learningRate = 0.05; // Adjusts how fast the multiplier adapts
        const newMultiplier = Math.max(0.5, Math.min(2.0, profile.retentionMultiplier + (error * learningRate)));
        
        // Update recent accuracy proxy
        const newAcc = (profile.recentAccuracy * 0.9) + (actualRecall * 0.1);
        
        await ctx.db.patch(profile._id, {
          retentionMultiplier: newMultiplier,
          recentAccuracy: newAcc,
          totalDataPoints: profile.totalDataPoints + 1,
          profileConfidence: Math.min(1.0, (profile.totalDataPoints + 1) / 100),
          updatedAt: now,
        });
      }

      const next = schedule(
        {
          stability: existing.stability,
          difficulty: existing.difficulty,
          reps: existing.reps,
          lapses: existing.lapses,
          state: existing.state,
          lastReview: existing.lastReview,
          nextReview: existing.nextReview,
        },
        args.rating as Rating,
        now,
        profile?.personalizedW,
        profile?.retentionMultiplier,
        profile?.targetRetention,
        card.type
      );
      await ctx.db.patch(existing._id, next);
    } else {
      const fresh = newCardState();
      const next = schedule(
        { ...fresh, state: "new" },
        args.rating as Rating,
        now,
        profile?.personalizedW,
        profile?.retentionMultiplier,
        profile?.targetRetention,
        card.type
      );
      await ctx.db.insert("userCardState", {
        userId: args.userId,
        cardId: args.cardId,
        ...next,
      });
    }

    // Update total review count & XP on user
    const user = await ctx.db.get(args.userId);
    if (user) {
      const xpGain = args.wasCorrect ? 10 : 2;
      await ctx.db.patch(args.userId, {
        totalReviews: user.totalReviews + 1,
        xp: (user.xp ?? 0) + xpGain,
        weeklyXp: (user.weeklyXp ?? 0) + xpGain,
      });
    }

    // Mark card complete in session
    if (session) {
      await ctx.db.patch(args.sessionId, {
        completedCardIds: [...session.completedCardIds, args.cardId],
      });
    }
  },
});

// ─── Get due cards for a user (spaced repetition queue) ──────────────────────
export const getDueCards = query({
  args: {
    userId: v.id("users"),
    subtopicIds: v.optional(v.array(v.id("subtopics"))),
    topicId: v.optional(v.id("topics")),
    subjectId: v.optional(v.id("subjects")),
    courseId: v.optional(v.id("courses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    const limit = args.limit ?? 100;
    const now = Date.now();

    let validSubtopicIds: Set<string> | null = null;
    if (args.subtopicIds && args.subtopicIds.length > 0) {
      validSubtopicIds = new Set(args.subtopicIds);
    } else if (args.topicId) {
      const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", args.topicId!)).collect();
      validSubtopicIds = new Set(subs.map((s) => s._id));
    } else if (args.subjectId) {
      const topics = await ctx.db.query("topics").withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId!)).collect();
      validSubtopicIds = new Set();
      for (const t of topics) {
        const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", t._id)).collect();
        subs.forEach((s) => validSubtopicIds!.add(s._id));
      }
    } else if (args.courseId) {
      const subjects = await ctx.db.query("subjects").withIndex("by_course", (q) => q.eq("courseId", args.courseId!)).collect();
      validSubtopicIds = new Set();
      for (const s of subjects) {
        const topics = await ctx.db.query("topics").withIndex("by_subject", (q) => q.eq("subjectId", s._id)).collect();
        for (const t of topics) {
          const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", t._id)).collect();
          subs.forEach((sub) => validSubtopicIds!.add(sub._id));
        }
      }
    }

    // Cards with existing FSRS state that are due
    const reviewQuery = ctx.db
      .query("userCardState")
      .withIndex("by_next_review", (q) =>
        q.eq("userId", args.userId).lte("nextReview", now),
      );

    const dueStates = (await reviewQuery.collect()).filter(s => !s.isArchived);

    const cards = await Promise.all(
      dueStates.map(async (state) => {
        const card = await ctx.db.get(state.cardId);
        if (!card) return null;
        
        // Filter by subtopic if provided
        if (validSubtopicIds && card.subtopicId && !validSubtopicIds.has(card.subtopicId)) {
          return null;
        }
        
        return {
          card,
          state,
          mentalHook: state.mentalHook,
          isLeech: (state.lapses ?? 0) >= 5,
        };
      }),
    );

    const resolvedCards = cards
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => item.card.isPublished);

    // Sort by retrievability (lowest recall probability first) (P1)
    resolvedCards.sort((a, b) => {
      const elapsedDaysA = (now - a.state.lastReview) / 86_400_000;
      const elapsedDaysB = (now - b.state.lastReview) / 86_400_000;
      const rA = retrievability(elapsedDaysA, a.state.stability);
      const rB = retrievability(elapsedDaysB, b.state.stability);
      return rA - rB;
    });

    return resolvedCards.slice(0, limit);
  },
});

// ─── Get new cards (never seen) for a user ───────────────────────────────────
export const getNewCards = query({
  args: {
    userId: v.id("users"),
    subtopicIds: v.optional(v.array(v.id("subtopics"))),
    topicId: v.optional(v.id("topics")),
    subjectId: v.optional(v.id("subjects")),
    courseId: v.optional(v.id("courses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    const caller = await validateUserOwnership(ctx, args.userId);
    const userTier = caller.tier;

    const limit = args.limit ?? 100;

    let validSubtopicIds: Set<string> | null = null;
    if (args.subtopicIds && args.subtopicIds.length > 0) {
      validSubtopicIds = new Set(args.subtopicIds);
    } else if (args.topicId) {
      const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", args.topicId!)).collect();
      validSubtopicIds = new Set(subs.map((s) => s._id));
    } else if (args.subjectId) {
      const topics = await ctx.db.query("topics").withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId!)).collect();
      validSubtopicIds = new Set();
      for (const t of topics) {
        const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", t._id)).collect();
        subs.forEach((s) => validSubtopicIds!.add(s._id));
      }
    } else if (args.courseId) {
      const subjects = await ctx.db.query("subjects").withIndex("by_course", (q) => q.eq("courseId", args.courseId!)).collect();
      validSubtopicIds = new Set();
      for (const s of subjects) {
        const topics = await ctx.db.query("topics").withIndex("by_subject", (q) => q.eq("subjectId", s._id)).collect();
        for (const t of topics) {
          const subs = await ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", t._id)).collect();
          subs.forEach((sub) => validSubtopicIds!.add(sub._id));
        }
      }
    }

    // Get all card IDs the user has seen
    const seenStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Ignore archived cards as 'seen' if they were archived to be skipped
    const archivedCardIds = new Set(seenStates.filter(s => s.isArchived).map(s => s.cardId.toString()));
    const seenCardIds = new Set(seenStates.filter(s => !s.isArchived).map((s) => s.cardId.toString()));

    // Get published cards the user hasn't seen yet
    let cards = [];
    if (validSubtopicIds) {
      const results = await Promise.all(
        Array.from(validSubtopicIds).map((stId) =>
          ctx.db
            .query("cards")
            .withIndex("by_subtopic", (q) => q.eq("subtopicId", stId as import("./_generated/dataModel").Id<"subtopics">))
            .collect(),
        ),
      );
      cards = results.flat();
    } else {
      cards = await ctx.db.query("cards").collect();
    }

    return cards
      .filter(
        (c) =>
          c.isPublished &&
          !seenCardIds.has(c._id.toString()) &&
          !archivedCardIds.has(c._id.toString()) &&
          (userTier !== "free" || c.tier === "free"),
      )
      .map(c => {
        const state = seenStates.find(s => s.cardId === c._id);
        return { ...c, mentalHook: state?.mentalHook };
      })
      .slice(0, limit);
  },
});
