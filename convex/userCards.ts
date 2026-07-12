import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateUserOwnership } from "./authHelpers";

export const getUserCards = query({
  args: {
    userId: v.id("users"),
    courseId: v.optional(v.id("courses")),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    // 1. Get all user states
    const statesQuery = ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    const states = await statesQuery.collect();

    // 2. Fetch card details and build list
    const cardData = await Promise.all(
      states.map(async (state) => {
        const card = await ctx.db.get(state.cardId);
        if (!card) return null;

        // Filter by archive status if requested
        const archivedStatus = state.isArchived ?? false;
        if (args.isArchived !== undefined && archivedStatus !== args.isArchived) {
          return null;
        }

        // Fetch hierarchy info
        let subtopic = null;
        let topic = null;
        let subject = null;
        let course = null;

        if (card.subtopicId) {
          subtopic = await ctx.db.get(card.subtopicId);
          if (subtopic) {
            topic = await ctx.db.get(subtopic.topicId);
            if (topic) {
              subject = await ctx.db.get(topic.subjectId);
              if (subject && subject.courseId) {
                course = await ctx.db.get(subject.courseId);
              }
            }
          }
        }

        // Filter by course if requested
        if (args.courseId && course?._id !== args.courseId) {
          return null;
        }

        return {
          ...state,
          card,
          hierarchy: {
            subtopic: subtopic?.name,
            topic: topic?.name,
            subject: subject?.name,
            course: course?.name,
            courseId: course?._id,
          }
        };
      })
    );

    return cardData.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

export const toggleArchiveCard = mutation({
  args: {
    userId: v.id("users"),
    cardId: v.id("cards"),
    archive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    const existing = await ctx.db
      .query("userCardState")
      .withIndex("by_user_card", (q) => q.eq("userId", args.userId).eq("cardId", args.cardId))
      .unique();

    if (!existing) {
      // If no state exists, create one in 'new' state just to mark it archived
      // This might happen if a user wants to archive a card they haven't seen yet
      // But usually they archive cards they've seen.
      // For now, let's assume they only archive seen cards OR we create a skeleton.
      await ctx.db.insert("userCardState", {
        userId: args.userId,
        cardId: args.cardId,
        stability: 0,
        difficulty: 5,
        lastReview: Date.now(),
        nextReview: Date.now(),
        reps: 0,
        lapses: 0,
        state: "new",
        isArchived: args.archive,
      });
    } else {
      await ctx.db.patch(existing._id, { isArchived: args.archive });
    }
  },
});

export const archiveByCourse = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    archive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    // This is expensive as it requires scanning or careful joins
    // 1. Get all subjects in course
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    
    const subjectIds = subjects.map(s => s._id);

    // 2. Get all topics in those subjects
    const allTopics = await Promise.all(
      subjectIds.map(sid => ctx.db.query("topics").withIndex("by_subject", (q) => q.eq("subjectId", sid)).collect())
    );
    const topicIds = allTopics.flat().map(t => t._id);

    // 3. Get all subtopics
    const allSubtopics = await Promise.all(
      topicIds.map(tid => ctx.db.query("subtopics").withIndex("by_topic", (q) => q.eq("topicId", tid)).collect())
    );
    const subtopicIds = allSubtopics.flat().map(st => st._id);

    // 4. Get all cards in those subtopics
    const allCards = await Promise.all(
      subtopicIds.map(stid => ctx.db.query("cards").withIndex("by_subtopic", (q) => q.eq("subtopicId", stid)).collect())
    );
    const cardIds = new Set(allCards.flat().map(c => c._id));

    // 5. Update user states for these cards
    const userStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const state of userStates) {
      if (cardIds.has(state.cardId)) {
        await ctx.db.patch(state._id, { isArchived: args.archive });
      }
    }
  },
});

export const saveMentalHook = mutation({
  args: {
    userId: v.id("users"),
    cardId: v.id("cards"),
    hook: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    const existing = await ctx.db
      .query("userCardState")
      .withIndex("by_user_card", (q) => q.eq("userId", args.userId).eq("cardId", args.cardId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { mentalHook: args.hook });
    } else {
      await ctx.db.insert("userCardState", {
        userId: args.userId,
        cardId: args.cardId,
        stability: 0,
        difficulty: 5,
        lastReview: Date.now(),
        nextReview: Date.now(),
        reps: 0,
        lapses: 0,
        state: "new",
        mentalHook: args.hook,
      });
    }
  },
});
