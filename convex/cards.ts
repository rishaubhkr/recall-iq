import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
    
    const subtopic = await ctx.db.get(args.subtopicId);
    if (!subtopic) throw new Error("Subtopic not found.");
    const topic = await ctx.db.get(subtopic.topicId);
    if (!topic) throw new Error("Topic not found.");
    const subject = await ctx.db.get(topic.subjectId);
    if (!subject) throw new Error("Subject not found.");

    return ctx.db.insert("cards", { 
      ...args, 
      topicId: topic._id,
      subjectId: subject._id,
      courseId: subject.courseId,
      isPublished: false 
    });
  },
});

export const updateCard = mutation({
  args: {
    id: v.id("cards"),
    type: v.optional(v.string()),
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
    paginationOpts: paginationOptsValidator,
    courseId: v.optional(v.id("courses")),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    subtopicId: v.optional(v.id("subtopics")),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("cards");

    if (args.subtopicId) {
      q = q.withIndex("by_subtopic", (q: any) => q.eq("subtopicId", args.subtopicId));
    } else if (args.topicId) {
      q = q.withIndex("by_topic", (q: any) => q.eq("topicId", args.topicId));
    } else if (args.subjectId) {
      q = q.withIndex("by_subject", (q: any) => q.eq("subjectId", args.subjectId));
    } else if (args.courseId) {
      q = q.withIndex("by_course", (q: any) => q.eq("courseId", args.courseId));
    } else {
      q = q.order("desc");
    }

    if (args.isPublished !== undefined) {
      q = q.filter((q: any) => q.eq(q.field("isPublished"), args.isPublished));
    }

    return await q.paginate(args.paginationOpts);
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

export const migrateCardsHierarchy = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    let count = 0;
    for (const card of cards) {
      if (card.subtopicId && (!card.topicId || !card.subjectId)) {
        const subtopic = await ctx.db.get(card.subtopicId);
        if (subtopic) {
          const topic = await ctx.db.get(subtopic.topicId);
          if (topic) {
            const subject = await ctx.db.get(topic.subjectId);
            if (subject) {
              await ctx.db.patch(card._id, {
                topicId: topic._id,
                subjectId: subject._id,
                courseId: subject.courseId,
              });
              count++;
            }
          }
        }
      }
    }
    return `Migrated ${count} cards`;
  },
});
