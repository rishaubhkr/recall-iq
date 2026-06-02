import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Card CRUD (admin) ────────────────────────────────────────────────────────
export const createCard = mutation({
  args: {
    subtopicId: v.optional(v.id("subtopics")),
    type: v.union(
      v.literal("flashcard"),
      v.literal("mcq"),
      v.literal("cloze"),
      v.literal("elaborative"),
      v.literal("numerical"),
      v.literal("assertion_reason"),
      v.literal("error_spotting"),
      v.literal("matrix_match"),
      v.literal("sequencing"),
      v.literal("concept_interleave"),
      v.literal("image_occlusion"),
      v.literal("multi_select"),
      v.literal("true_false_justify"),
    ),
    tier: v.union(v.literal("free"), v.literal("premium")),
    front: v.string(),
    back: v.string(),
    options: v.optional(v.array(v.string())),
    correctOption: v.optional(v.number()),
    clozeTemplate: v.optional(v.string()),
    whyPrompt: v.optional(v.string()),
    tags: v.array(v.string()),
    advancedMetadata: v.optional(v.any()),
    correctOptions: v.optional(v.array(v.number())),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.subtopicId) {
      throw new Error("Card must belong to a subtopic.");
    }
    return ctx.db.insert("cards", { ...args, isPublished: false });
  },
});

export const updateCard = mutation({
  args: {
    id: v.id("cards"),
    front: v.optional(v.string()),
    back: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("free"), v.literal("premium"))),
    options: v.optional(v.array(v.string())),
    correctOption: v.optional(v.number()),
    clozeTemplate: v.optional(v.string()),
    whyPrompt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    advancedMetadata: v.optional(v.any()),
    correctOptions: v.optional(v.array(v.number())),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const deleteCard = mutation({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const togglePublish = mutation({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) throw new Error("Card not found");
    await ctx.db.patch(args.id, { isPublished: !card.isPublished });
  },
});

// ─── Card queries ─────────────────────────────────────────────────────────────
export const getCardsBySubtopic = query({
  args: {
    subtopicId: v.id("subtopics"),
    userTier: v.optional(v.union(v.literal("free"), v.literal("premium"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("cards")
      .withIndex("by_subtopic", (q) => q.eq("subtopicId", args.subtopicId));

    const cards = await q.collect();

    // Freemium gate: free users see only free cards
    if (args.userTier === "free") {
      return cards.filter((c) => c.tier === "free" && c.isPublished);
    }
    return cards.filter((c) => c.isPublished);
  },
});

export const getCard = query({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getCardsByIds = query({
  args: { ids: v.array(v.id("cards")) },
  handler: async (ctx, args) => {
    return Promise.all(args.ids.map((id) => ctx.db.get(id)));
  },
});

export const adminListCards = query({
  args: {
    courseId: v.optional(v.id("courses")),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    subtopicId: v.optional(v.id("subtopics")),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let validSubtopicIds: Set<string> | null = null;

    if (args.subtopicId) {
      validSubtopicIds = new Set([args.subtopicId]);
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

    let cards = [];
    if (validSubtopicIds) {
      for (const sid of validSubtopicIds) {
        const subCards = await ctx.db.query("cards").withIndex("by_subtopic", (q) => q.eq("subtopicId", sid as import("./_generated/dataModel").Id<"subtopics">)).collect();
        cards.push(...subCards);
      }
    } else {
      cards = await ctx.db.query("cards").collect();
    }

    if (args.isPublished !== undefined) {
      cards = cards.filter((c) => c.isPublished === args.isPublished);
    }

    return cards;
  },
});

export const bulkPublish = mutation({
  args: { ids: v.array(v.id("cards")), isPublished: v.boolean() },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { isPublished: args.isPublished });
    }
  },
});

export const bulkDeleteCards = mutation({
  args: { ids: v.array(v.id("cards")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});
