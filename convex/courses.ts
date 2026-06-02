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

