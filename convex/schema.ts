import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Content Hierarchy (Course-First PW Model) ───────────────────────────────────
  courses: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    priceTier: v.union(v.literal("free"), v.literal("premium")),
    isPublished: v.boolean(),
    isPersonal: v.optional(v.boolean()), // Flag for student-generated content
    ownerId: v.optional(v.string()),     // Clerk User ID for sandbox security
    order: v.number(),
    // Flexible hierarchy labels — customizable per course
    hierarchyLabels: v.optional(v.object({
      l1: v.string(),
      l2: v.string(),
      l3: v.string(),
    })),
    // Hierarchy depth: 1=flat (l1→cards), 2=two-level, 3=full three-level (default)
    hierarchyDepth: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  }).index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  subjects: defineTable({
    courseId: v.optional(v.id("courses")),
    examId: v.optional(v.string()), // For legacy records
    name: v.string(),
    slug: v.string(),
    color: v.string(),      // hex color for UI badging
    order: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_slug", ["slug"]),

  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_slug", ["slug"]),

  subtopics: defineTable({
    topicId: v.id("topics"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_slug", ["slug"]),

  // Standalone courses removed in favor of top-level course hierarchy

  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  // ─── Cards ─────────────────
  cards: defineTable({
    subtopicId: v.optional(v.id("subtopics")),
    type: v.union(
      v.literal("flashcard"),    // Retrieval Practice
      v.literal("mcq"),          // Interleaving-friendly
      v.literal("cloze"),        // Generation Effect
      v.literal("elaborative"),  // Elaborative Interrogation
      v.literal("numerical"),
      v.literal("assertion_reason"),
      v.literal("error_spotting"),
      v.literal("matrix_match"),
      v.literal("sequencing"),
      v.literal("concept_interleave"),
      v.literal("image_occlusion"),
      v.literal("graph_id"),
      v.literal("multi_select"),
      v.literal("true_false_justify"),
    ),
    tier: v.union(v.literal("free"), v.literal("premium")),
    front: v.string(),           // Markdown + KaTeX
    back: v.string(),            // Markdown + KaTeX
    // MCQ-specific
    options: v.optional(v.array(v.string())),
    correctOption: v.optional(v.number()),
    // Cloze-specific: [[blank]] template syntax
    clozeTemplate: v.optional(v.string()),
    // Elaborative follow-up ("Why does this work?")
    whyPrompt: v.optional(v.string()),
    advancedMetadata: v.optional(v.any()), // Stores specific data for complex card types
    tags: v.array(v.string()),
    isPublished: v.boolean(),
    createdBy: v.string(),       // Clerk user ID (admin)
    ownerId: v.optional(v.string()), // Clerk user ID (student) for personal cards
  })
    .index("by_subtopic", ["subtopicId"])
    .index("by_tier", ["tier"])
    .index("by_published", ["isPublished"])
    .index("by_owner", ["ownerId"]),

  // ─── Users ────────────────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    tier: v.union(v.literal("free"), v.literal("premium"), v.literal("admin")),
    streak: v.number(),
    lastActiveDate: v.optional(v.string()), // ISO date string
    totalReviews: v.number(),
    xp: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_tier", ["tier"])
    .index("by_xp", ["xp"]),

  // ─── FSRS v5 Per-Card-Per-User State ──────────────────────────────────────
  userCardState: defineTable({
    userId: v.id("users"),
    cardId: v.id("cards"),
    stability: v.number(),      // FSRS: how long memory persists (days)
    difficulty: v.number(),     // FSRS: 0-10 difficulty rating
    lastReview: v.number(),     // Unix timestamp ms
    nextReview: v.number(),     // Unix timestamp ms (scheduled)
    reps: v.number(),           // total successful repetitions
    lapses: v.number(),         // times forgotten
    state: v.union(
      v.literal("new"),
      v.literal("learning"),
      v.literal("review"),
      v.literal("relearning"),
    ),
    isArchived: v.optional(v.boolean()),
    mentalHook: v.optional(v.string()), // Personal mnemonic or note
  })
    .index("by_user", ["userId"])
    .index("by_user_card", ["userId", "cardId"])
    .index("by_next_review", ["userId", "nextReview"]),

  // ─── Sessions ─────────────────────────────────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    mode: v.union(
      v.literal("spaced"),       // due-card queue
      v.literal("interleaved"),  // mixed subjects
      v.literal("subject"),      // single subject drill
    ),
    subjectIds: v.optional(v.array(v.id("subjects"))),
    cardIds: v.array(v.id("cards")),
    completedCardIds: v.array(v.id("cards")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    totalCards: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "startedAt"]),

  // ─── Reviews (per card per session) ───────────────────────────────────────
  reviews: defineTable({
    sessionId: v.id("sessions"),
    cardId: v.id("cards"),
    userId: v.id("users"),
    // FSRS rating: 1=Again, 2=Hard, 3=Good, 4=Easy
    rating: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
    // Calibration self-confidence (1-5 stars, logged BEFORE reveal)
    confidence: v.number(),
    wasCorrect: v.boolean(),
    responseMs: v.number(),     // time to answer in milliseconds
    reviewedAt: v.number(),     // Unix timestamp ms
  })
    .index("by_user", ["userId"])
    .index("by_card", ["cardId"])
    .index("by_session", ["sessionId"])
    .index("by_user_card", ["userId", "cardId"]),

  // ─── User Memory Profiles (Adaptive Forgetting Curve) ───────────────────
  userMemoryProfile: defineTable({
    userId: v.id("users"),
    subjectId: v.optional(v.id("subjects")), // If null, this is their global baseline
    
    // Bayesian traits (Phase 1)
    retentionMultiplier: v.number(),  // >1 = retains longer, <1 = forgets faster
    learningSpeed: v.number(),        // >1 = learns faster, <1 = needs more reps
    
    // Settings
    targetRetention: v.number(),      // 0.8 to 0.99
    
    // Confidence & meta
    profileConfidence: v.number(),    // 0-1 (based on data volume)
    totalDataPoints: v.number(),      // reviews used
    
    // Rolling accuracy (for trend detection)
    recentAccuracy: v.number(),       // Last 50 reviews proxy
    
    // Phase 2: Personalized FSRS params (null until optimizer runs)
    personalizedW: v.optional(v.array(v.number())),
    lastOptimizedAt: v.optional(v.number()),
    
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_subject", ["userId", "subjectId"]),
});
