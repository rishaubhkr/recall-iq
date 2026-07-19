import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { validateUserOwnership } from "./authHelpers";
import { retrievability } from "./fsrs";

// ─── Create a new study session ───────────────────────────────────────────────
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(
      v.literal("spaced"),
      v.literal("interleaved"),
      v.literal("subject"),
    ),
    cardIds: v.array(v.id("cards")),
    subjectIds: v.optional(v.array(v.id("subjects"))),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    return ctx.db.insert("sessions", {
      userId: args.userId,
      mode: args.mode,
      cardIds: args.cardIds,
      subjectIds: args.subjectIds,
      completedCardIds: [],
      startedAt: Date.now(),
      completedAt: undefined,
      totalCards: args.cardIds.length,
    });
  },
});

// ─── Complete a session ───────────────────────────────────────────────────────
export const completeSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, session.userId);

    await ctx.db.patch(args.sessionId, { completedAt: Date.now() });
  },
});

// ─── Get an active session ────────────────────────────────────────────────────
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, session.userId);

    return session;
  },
});

// ─── Build an interleaved session (round-robin across subjects) ───────────────
export const buildInterleavedSession = query({
  args: {
    userId: v.id("users"),
    subjectIds: v.array(v.id("subjects")),
    cardsPerSubject: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    const caller = await validateUserOwnership(ctx, args.userId);
    const userTier = caller.tier;

    const perSubject = args.cardsPerSubject ?? 4;
    const now = Date.now();

    const seenStates = await ctx.db
      .query("userCardState")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    // Map cardId → state for O(1) lookups in the loop below
    const seenMap = new Map(seenStates.map((s) => [s.cardId.toString(), s]));
    const seenCardIds = new Set(seenStates.map((s) => s.cardId.toString()));

    // Collect cards per subject (mix of due + new)
    const buckets = await Promise.all(
      args.subjectIds.map(async (subjectId) => {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_subject", (q) => q.eq("subjectId", subjectId))
          .collect();

        // Collect all eligible cards under this subject
        const subjectCards = [];
        for (const topic of topics) {
          const subtopics = await ctx.db
            .query("subtopics")
            .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
            .collect();
          for (const sub of subtopics) {
            const cards = await ctx.db
              .query("cards")
              .withIndex("by_subtopic", (q) => q.eq("subtopicId", sub._id))
              .collect();
            subjectCards.push(
              ...cards.filter(
                (c) =>
                  c.ownerId === args.userId ||
                  (c.isPublished && (userTier !== "free" || c.tier === "free")),
              ),
            );
          }
        }

        // Separate due and new cards
        const dueCardsWithState: { id: Id<"cards">; stability: number; lastReview: number }[] = [];
        const newCards: Id<"cards">[] = [];

        for (const card of subjectCards) {
          const state = seenMap.get(card._id.toString());
          if (state) {
            if (!state.isArchived && state.nextReview <= now) {
              dueCardsWithState.push({
                id: card._id,
                stability: state.stability,
                lastReview: state.lastReview,
              });
            }
          } else {
            newCards.push(card._id);
          }
        }

        // Sort due cards by retrievability (lowest first)
        dueCardsWithState.sort((a, b) => {
          const elapsedA = (now - a.lastReview) / 86_400_000;
          const elapsedB = (now - b.lastReview) / 86_400_000;
          const rA = retrievability(elapsedA, a.stability);
          const rB = retrievability(elapsedB, b.stability);
          return rA - rB;
        });

        const dueSortedIds = dueCardsWithState.map(c => c.id);

        // Mix due and new up to perSubject limit
        const mixed = [...dueSortedIds];
        if (mixed.length < perSubject) {
          mixed.push(...newCards.slice(0, perSubject - mixed.length));
        }
        return mixed.slice(0, perSubject);
      }),
    );

    // Round-robin interleave the buckets
    const interleaved: Id<"cards">[] = [];
    const maxLen = Math.max(...buckets.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        if (bucket[i]) interleaved.push(bucket[i]);
      }
    }

    return interleaved;
  },
});

// ─── Recent sessions for a user ───────────────────────────────────────────────
export const getUserSessions = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Validate identity ownership to prevent IDOR
    await validateUserOwnership(ctx, args.userId);

    return ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 10);
  },
});
