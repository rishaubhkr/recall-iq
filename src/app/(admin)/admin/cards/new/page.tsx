"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { CardEditor, type CardFormData } from "@/components/admin/CardEditor";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, BookOpen, GraduationCap, X } from "lucide-react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function NewCardPage() {
  const router = useRouter();
  const { convexUser, isLoading: userLoading } = useConvexUser();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course/Batch State
  const courses = useQuery(api.courses.listAllCourses);
  const [activeCourseId, setActiveCourseId] = useState<Id<"courses"> | null>(null);
  const courseId = activeCourseId ?? courses?.[0]?._id ?? null;
  const tree = useQuery(api.subjects.getFullTree, courseId ? { courseId } : "skip");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<Id<"subtopics"> | "">("");

  const createCard = useMutation(api.cards.createCard);

  // Flatten tree → subtopic options for select
  const subtopicOptions: { label: string; id: Id<"subtopics"> }[] = [];
  tree?.forEach((subject: any) =>
    subject.topics.forEach((topic: any) =>
      topic.subtopics.forEach((sub: any) => {
        let label = subject.name;
        if (topic.name !== "__default__") label += ` → ${topic.name}`;
        if (sub.name !== "__default__") label += ` → ${sub.name}`;
        
        subtopicOptions.push({
          label,
          id: sub._id,
        });
      })
    )
  );

  const handleSave = async (data: CardFormData) => {
    if (!selectedSubtopicId) {
      setError("Please select a subtopic before saving.");
      return;
    }
    if (!convexUser) {
      setError("User not loaded yet — try again.");
      return;
    }
    
    setError(null);
    setIsSaving(true);
    
    try {
      await createCard({
        subtopicId: selectedSubtopicId as Id<"subtopics">,
        type: data.type as any,
        tier: data.tier,
        front: data.front,
        back: data.back,
        options: data.options,
        correctOption: data.correctOption,
        clozeTemplate: data.clozeTemplate,
        whyPrompt: data.whyPrompt,
        tags: data.tags,
        createdBy: convexUser.clerkId,
      });
      router.push("/admin/cards");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save card.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/cards" className="btn-icon" aria-label="Back">
          <ChevronLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
            Admin · Cards
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Create Flashcard
          </h1>
        </div>
      </div>

      {/* Step 1: Select Destination */}
      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "var(--accent)", color: "black", borderRadius: "50%", fontSize: "0.8rem" }}>1</span>
            Select Destination
          </h2>
        </div>

        <div className="animate-in fade-in" style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>1. Select Course</label>
          {courses && courses.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {courses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => { setActiveCourseId(course._id); setSelectedSubtopicId(""); }}
                  className={course._id === (courseId ?? "") ? "btn btn-primary" : "btn btn-ghost"}
                  style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
                >
                  {course.name}
                </button>
              ))}
            </div>
          ) : (
             <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
               No courses available. <Link href="/admin/courses" style={{ color: "var(--accent)" }}>Create a course first →</Link>
             </p>
          )}

          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>2. Select Subtopic</label>
          {tree === undefined && courseId ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", padding: "0.5rem" }}>
              <Loader2 size={14} className="animate-spin" /> Loading hierarchy…
            </div>
          ) : subtopicOptions.length > 0 ? (
            <select
              className="input select"
              value={selectedSubtopicId}
              onChange={(e) => setSelectedSubtopicId(e.target.value as Id<"subtopics">)}
              style={{ width: "100%", background: "rgba(0,0,0,0.3)" }}
            >
              <option value="">— Choose a subtopic —</option>
              {subtopicOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              No subtopics yet for this course. <Link href="/admin/courses" style={{ color: "var(--accent)" }}>Add subjects & topics first →</Link>
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", color: "#FCA5A5", fontSize: "0.875rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <X size={16} /> {error}
        </div>
      )}

      {/* Step 2: Content */}
      <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "var(--accent)", color: "black", borderRadius: "50%", fontSize: "0.8rem" }}>2</span>
          Card Content
        </h2>
        <CardEditor onSave={handleSave} isSaving={isSaving} />
      </div>
    </div>
  );
}
