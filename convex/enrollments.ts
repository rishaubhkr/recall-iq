import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Enroll a user into a course
export const enrollUser = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_user_course", (q) => 
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("enrollments", {
      userId: args.userId,
      courseId: args.courseId,
      enrolledAt: Date.now(),
      status: "active",
    });
  },
});

// Get user's enrolled courses
export const getUserEnrollments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Fetch the actual course data for each enrollment
    const coursesWithEnrollment = await Promise.all(
      enrollments.map(async (enr) => {
        const course = await ctx.db.get(enr.courseId);
        return { enrollment: enr, course };
      })
    );

    return coursesWithEnrollment.filter((item) => item.course !== null);
  },
});
