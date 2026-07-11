import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────────────

// List published courses for the student catalog
export const listPublishedCourses = query({
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    
    return courses.sort((a, b) => a.order - b.order);
  },
});

// List all courses (for Admin)
export const listAllCourses = query({
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    return courses.sort((a, b) => a.order - b.order);
  },
});

// Get a single course
export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

// Get real-time stats for a course (modules, cards, students)
export const getCourseStats = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    let cardCount = 0;
    for (const s of subjects) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", s._id))
        .collect();
      for (const t of topics) {
        const subs = await ctx.db
          .query("subtopics")
          .withIndex("by_topic", (q) => q.eq("topicId", t._id))
          .collect();
        for (const sub of subs) {
          const cards = await ctx.db
            .query("cards")
            .withIndex("by_subtopic", (q) => q.eq("subtopicId", sub._id))
            .collect();
          cardCount += cards.length;
        }
      }
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return {
      moduleCount: subjects.length,
      cardCount,
      studentCount: enrollments.length,
    };
  },
});

// ─── Admin Mutations ────────────────────────────────────────────────────────

export const createCourse = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    priceTier: v.union(v.literal("free"), v.literal("premium")),
    isPublished: v.boolean(),
    order: v.number(),
    hierarchyLabels: v.optional(v.object({
      l1: v.string(),
      l2: v.string(),
      l3: v.string(),
    })),
    hierarchyDepth: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", args);
  },
});

export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    priceTier: v.optional(v.union(v.literal("free"), v.literal("premium"))),
    isPublished: v.optional(v.boolean()),
    order: v.optional(v.number()),
    hierarchyLabels: v.optional(v.object({
      l1: v.string(),
      l2: v.string(),
      l3: v.string(),
    })),
    hierarchyDepth: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    // 1. Delete cards
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_course", (q) => q.eq("courseId", args.id))
      .collect();
    for (const c of cards) await ctx.db.delete(c._id);

    // 2. Delete subjects, topics, and subtopics
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_course", (q) => q.eq("courseId", args.id))
      .collect();
      
    for (const s of subjects) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", s._id))
        .collect();
        
      for (const t of topics) {
        const subtopics = await ctx.db
          .query("subtopics")
          .withIndex("by_topic", (q) => q.eq("topicId", t._id))
          .collect();
        for (const sub of subtopics) await ctx.db.delete(sub._id);
        
        await ctx.db.delete(t._id);
      }
      await ctx.db.delete(s._id);
    }

    // 3. Delete enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.id))
      .collect();
    for (const e of enrollments) await ctx.db.delete(e._id);

    // 4. Finally delete the course
    await ctx.db.delete(args.id);
  },
});
