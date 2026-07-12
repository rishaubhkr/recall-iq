import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Subjects ────────────────────────────────────────────────────────────────
export const listSubjectsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subjects")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const createSubject = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("subjects", args);
  },
});

// For depth=1 courses: creates subject + hidden default topic + hidden default subtopic
// The hidden nodes use the __default__ slug sentinel so the UI knows to skip them.
export const createSubjectWithAutoLeaf = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const subjectId = await ctx.db.insert("subjects", args);
    const topicId = await ctx.db.insert("topics", {
      subjectId,
      name: "__default__",
      slug: "__default__",
      order: 1,
    });
    await ctx.db.insert("subtopics", {
      topicId,
      name: "__default__",
      slug: "__default__",
      order: 1,
    });
    return subjectId;
  },
});

// Returns the hidden default subtopicId for a flat-course subject
export const getDefaultSubtopicForSubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .first();
    if (!topic) return null;
    const subtopic = await ctx.db
      .query("subtopics")
      .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
      .first();
    return subtopic?._id ?? null;
  },
});

export const updateSubject = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkReorderSubjects = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("subjects"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.updates.map((update) => ctx.db.patch(update.id, { order: update.order }))
    );
  },
});

// ─── Topics ──────────────────────────────────────────────────────────────────
export const listTopicsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

export const createTopic = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("topics", args);
  },
});

export const updateTopic = mutation({
  args: {
    id: v.id("topics"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const deleteTopic = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkReorderTopics = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("topics"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.updates.map((update) => ctx.db.patch(update.id, { order: update.order }))
    );
  },
});

// ─── Subtopics ────────────────────────────────────────────────────────────────
export const listSubtopicsByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subtopics")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
  },
});

export const getSubtopicPath = query({
  args: { subtopicId: v.id("subtopics") },
  handler: async (ctx, args) => {
    const subtopic = await ctx.db.get(args.subtopicId);
    if (!subtopic) return null;
    const topic = await ctx.db.get(subtopic.topicId);
    if (!topic) return subtopic.name;
    const subject = await ctx.db.get(topic.subjectId);
    if (!subject) return `${topic.name} → ${subtopic.name}`;
    return `${subject.name} → ${topic.name} → ${subtopic.name}`;
  },
});

export const createSubtopic = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("subtopics", args);
  },
});

export const updateSubtopic = mutation({
  args: {
    id: v.id("subtopics"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const deleteSubtopic = mutation({
  args: { id: v.id("subtopics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkReorderSubtopics = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("subtopics"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.updates.map((update) => ctx.db.patch(update.id, { order: update.order }))
    );
  },
});

// ─── Full tree (for admin) ────────────────────────────────────────────────────
export const getFullTree = query({
  args: { 
    courseId: v.optional(v.id("courses")),
    examId: v.optional(v.string()),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    let subjects: any[] = [];
    if (args.courseId) {
      subjects = await ctx.db
        .query("subjects")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
        .collect();
    } else if (args.examId) {
      subjects = await ctx.db
        .query("subjects")
        .filter((q) => q.eq(q.field("examId"), args.examId))
        .collect();
    }

    const result = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_subject", (q) => q.eq("subjectId", subject._id))
          .collect();

        const topicsWithSubtopics = await Promise.all(
          topics.map(async (topic) => {
            const subtopics = await ctx.db
              .query("subtopics")
              .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
              .collect();
            
            const subtopicsWithCounts = await Promise.all(
              subtopics.map(async (sub) => {
                const cards = await ctx.db
                  .query("cards")
                  .withIndex("by_subtopic", (q) => q.eq("subtopicId", sub._id))
                  .collect();
                const publishedCards = cards.filter(c => c.isPublished);
                
                let seenCardCount = 0;
                if (args.userId) {
                  // Count how many of these published cards have a userCardState for this user
                  const states = await Promise.all(
                    publishedCards.map(c => 
                      ctx.db
                        .query("userCardState")
                        .withIndex("by_user_card", (q) => q.eq("userId", args.userId!).eq("cardId", c._id))
                        .first()
                    )
                  );
                  seenCardCount = states.filter(s => s !== null).length;
                }

                return { ...sub, cardCount: publishedCards.length, seenCardCount };
              })
            );
              
            return { ...topic, subtopics: subtopicsWithCounts };
          }),
        );

        return { ...subject, topics: topicsWithSubtopics };
      }),
    );

    return result;
  },
});
// ─── Flat subtopic list (for bulk import slug reference) ─────────────────────
export const listAllSubtopics = query({
  handler: async (ctx) => {
    return ctx.db.query("subtopics").collect();
  },
});
