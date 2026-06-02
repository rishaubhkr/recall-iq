import { mutation } from "./_generated/server";

export const deleteLegacySubjects = mutation({
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    let deletedCount = 0;
    
    for (const subject of subjects) {
      if (!subject.courseId) {
        await ctx.db.delete(subject._id);
        deletedCount++;
      }
    }
    
    return `Deleted ${deletedCount} legacy subjects missing a courseId.`;
  },
});
