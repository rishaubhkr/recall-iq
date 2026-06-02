import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a personal deck (course) for the user
export const createPersonalDeck = mutation({
  args: {
    userId: v.string(), // Clerk User ID
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Create Course
    const courseId = await ctx.db.insert("courses", {
      name: args.name,
      slug: slug,
      description: args.description,
      priceTier: "free",
      isPublished: false,
      isPersonal: true,
      ownerId: args.userId,
      order: Date.now(),
      hierarchyDepth: 1, // Flat hierarchy for personal decks
    });

    // Create default subject
    const subjectId = await ctx.db.insert("subjects", {
      courseId,
      name: "Default Subject",
      slug: slug + "-default",
      color: "#F59E0B",
      order: 1,
    });

    // Create default topic
    const topicId = await ctx.db.insert("topics", {
      subjectId,
      name: "Default Topic",
      slug: slug + "-topic",
      order: 1,
    });

    // Create default subtopic (where cards actually attach)
    const subtopicId = await ctx.db.insert("subtopics", {
      topicId,
      name: "Default Subtopic",
      slug: slug + "-subtopic",
      order: 1,
    });

    return { courseId, subjectId, topicId, subtopicId };
  },
});

export const getPersonalDecks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    const decksWithSubtopics = await Promise.all(
      courses.map(async (course) => {
        const subjects = await ctx.db.query("subjects").withIndex("by_course", q => q.eq("courseId", course._id)).collect();
        const firstSubject = subjects[0];
        if (!firstSubject) return { course, subtopicId: null };

        const topics = await ctx.db.query("topics").withIndex("by_subject", q => q.eq("subjectId", firstSubject._id)).collect();
        const firstTopic = topics[0];
        if (!firstTopic) return { course, subtopicId: null };

        const subtopics = await ctx.db.query("subtopics").withIndex("by_topic", q => q.eq("topicId", firstTopic._id)).collect();
        const firstSubtopic = subtopics[0];
        
        return { course, subtopicId: firstSubtopic?._id || null };
      })
    );

    return decksWithSubtopics;
  },
});

export const commitPersonalCards = mutation({
  args: {
    userId: v.string(),
    subtopicId: v.id("subtopics"),
    cards: v.array(
      v.object({
        type: v.string(),
        front: v.string(),
        back: v.string(),
        options: v.optional(v.array(v.string())),
        correctOption: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Validate ownership
    const subtopic = await ctx.db.get(args.subtopicId);
    if (!subtopic) throw new Error("Subtopic not found");
    const topic = await ctx.db.get(subtopic.topicId);
    if (!topic) throw new Error("Topic not found");
    const subject = await ctx.db.get(topic.subjectId);
    if (!subject || !subject.courseId) throw new Error("Subject/Course not found");
    const course = await ctx.db.get(subject.courseId);
    
    if (course?.ownerId !== args.userId) {
      throw new Error("Unauthorized: Cannot add cards to a deck you do not own.");
    }

    const insertedIds = [];
    for (const card of args.cards) {
      const id = await ctx.db.insert("cards", {
        subtopicId: args.subtopicId,
        type: card.type as any,
        tier: "free",
        front: card.front,
        back: card.back,
        options: card.options,
        correctOption: card.correctOption,
        tags: ["personal"],
        isPublished: false,
        createdBy: args.userId,
        ownerId: args.userId,
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});
