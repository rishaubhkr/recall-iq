"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { BookOpen, ChevronRight, Play, Loader2, Layers, Book, FileText } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Suspense, useState } from "react";
import { useConvexUser } from "@/hooks/useConvexUser";

export default function ClassroomPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-muted" /></div>}>
      <ClassroomContent />
    </Suspense>
  );
}

function ClassroomContent() {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId") as Id<"courses"> | null;

  // We fetch all courses just to get the name, assuming getCourse might not be exposed to students.
  const courses = useQuery(api.courses.listPublishedCourses);
  const effectiveCourseId = courseIdParam || courses?.[0]?._id;
  const course = courses?.find(c => c._id === effectiveCourseId);

  const { convexUserId } = useConvexUser();
  const tree = useQuery(
    api.subjects.getFullTree, 
    effectiveCourseId ? { courseId: effectiveCourseId, userId: convexUserId } : "skip"
  );

  // Keep track of which subjects/topics are expanded
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (courses === undefined || (effectiveCourseId && tree === undefined)) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "6rem", height: "100vh", alignItems: "center" }}>
        <Loader2 className="animate-spin text-muted" size={32} />
      </div>
    );
  }

  if (!effectiveCourseId || !course || !tree) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
        No published courses found. Please check back soon!
      </div>
    );
  }

  const totalCourseCards = tree.reduce((acc: number, sub: any) => {
    return acc + sub.topics.reduce((tAcc: number, top: any) => {
      return tAcc + top.subtopics.reduce((sAcc: number, st: any) => sAcc + st.cardCount, 0);
    }, 0);
  }, 0);

  return (
    <div className="animate-in" style={{ maxWidth: 900, margin: "0 auto", paddingBottom: "6rem" }}>
      
      {/* ─── Header ─── */}
      <div style={{ padding: "3rem 0 2rem 0", borderBottom: "1px solid var(--border)", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <Link href="/courses" style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "1rem", textDecoration: "none" }} className="hover:text-primary">
            <BookOpen size={14} /> Back to Courses
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: "0.5rem" }}>
            {course.name}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            {totalCourseCards} total cards in syllabus
          </p>
        </div>
        <Link 
          href={`/study?mode=subject&courseId=${course._id}`} 
          className="btn btn-primary"
          style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 700 }}
        >
          <Play size={18} fill="currentColor" style={{ marginRight: "0.5rem" }} />
          Study Course
        </Link>
      </div>

      {/* ─── Syllabus Tree ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tree.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "16px", color: "var(--text-muted)" }}>
            Syllabus is empty. Check back later!
          </div>
        )}

        {tree.map((subject: any) => {
          const isExpanded = expandedSubjects[subject._id] ?? true;
          const totalSubCards = subject.topics.reduce((acc: number, t: any) => acc + t.subtopics.reduce((s: number, st: any) => s + st.cardCount, 0), 0);
          const totalSeenCards = subject.topics.reduce((acc: number, t: any) => acc + t.subtopics.reduce((s: number, st: any) => s + (st.seenCardCount || 0), 0), 0);
          
          return (
            <div key={subject._id} style={{ border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", background: "var(--bg-elevated)" }}>
              {/* Subject Header */}
              <div 
                onClick={() => toggleSubject(subject._id)}
                style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
                className="hover:bg-white/5 transition-colors"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: subject.color || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}>
                    <Layers size={20} color="#000" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>{subject.name}</h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{totalSeenCards}/{totalSubCards} cards attempted</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Link 
                    href={`/study?mode=subject&subjectId=${subject._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost hover:bg-white/10 hover:border-white/20 transition-all" 
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
                  >
                    Study Subject
                  </Link>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: "50%", 
                    background: "rgba(255,255,255,0.04)", 
                    border: "1px solid rgba(255,255,255,0.08)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }} className="hover:bg-white/10 hover:border-white/20">
                    <ChevronRight size={18} style={{ color: "var(--text-primary)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </div>
                </div>
              </div>

              {/* Topics / Chapters */}
              {isExpanded && (
                <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {subject.topics.map((topic: any, topicIdx: number) => {
                    const isDefaultTopic = topic.slug === "__default__";

                    return (
                      <div key={topic._id} style={{ paddingTop: topicIdx > 0 ? "1rem" : "0" }}>
                        {!isDefaultTopic && (
                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <Book size={18} className="text-secondary" />
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{topic.name}</h3>
                              </div>
                              <Link 
                                href={`/study?mode=subject&topicId=${topic._id}`}
                                className="btn hover:bg-[#475569] hover:text-white transition-all" 
                                style={{ padding: "0.35rem 0.9rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "100px", background: "#334155", color: "#F8FAFC", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                              >
                                Study Chapter
                              </Link>
                            </div>
                            <hr style={{ border: "0", borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "0 0 1rem 0" }} />
                          </div>
                        )}

                        {/* Subtopics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.75rem" }}>
                          {topic.subtopics.map((sub: any) => {
                            if (sub.slug === "__default__" && isDefaultTopic) return null; // Flat course structure
                            const isComplete = sub.seenCardCount === sub.cardCount && sub.cardCount > 0;
                            const progress = sub.cardCount > 0 ? ((sub.seenCardCount || 0) / sub.cardCount) * 100 : 0;
                            
                            return (
                              <Link 
                                key={sub._id} 
                                href={`/study?mode=subject&subtopicId=${sub._id}`}
                                style={{ 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  justifyContent: "space-between",
                                  gap: "1.25rem",
                                  padding: "1.25rem", 
                                  background: "rgba(255,255,255,0.025)", 
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: "12px", 
                                  textDecoration: "none", 
                                  transition: "all 0.2s",
                                  position: "relative"
                                }}
                                className="hover:bg-white/5 hover:border-[rgba(255,255,255,0.15)] group"
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                  <div style={{ 
                                    width: 26, 
                                    height: 26, 
                                    borderRadius: "8px", 
                                    background: "rgba(255,255,255,0.04)", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: "1px"
                                  }} className="group-hover:bg-[#10B981]/15 transition-colors">
                                    <FileText size={15} className="text-secondary group-hover:text-[#10B981] transition-colors" />
                                  </div>
                                  <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.45 }} className="group-hover:text-primary transition-colors">
                                    {sub.name}
                                  </span>
                                </div>
                                
                                {/* Footer: Status Pill & Inline Completion Bar */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <span style={{ 
                                      fontSize: "0.75rem", 
                                      fontWeight: 600,
                                      color: isComplete ? "#10B981" : "#E2E8F0", 
                                      background: isComplete ? "rgba(16, 185, 129, 0.15)" : "#334155", 
                                      padding: "0.2rem 0.6rem", 
                                      borderRadius: "100px",
                                      border: "1px solid rgba(255,255,255,0.05)"
                                    }}>
                                      {sub.seenCardCount !== undefined ? `${sub.seenCardCount}/${sub.cardCount}` : sub.cardCount} cards
                                    </span>
                                  </div>
                                  
                                  {/* Sleek Inline Progress Bar */}
                                  {sub.cardCount > 0 && (
                                    <div style={{
                                      width: "100%",
                                      height: "4px",
                                      background: "rgba(255,255,255,0.08)",
                                      borderRadius: "100px",
                                      overflow: "hidden"
                                    }}>
                                      <div style={{
                                        height: "100%",
                                        width: `${progress}%`,
                                        background: isComplete ? "#10B981" : "#38BDF8",
                                        borderRadius: "100px",
                                        transition: "width 0.5s ease-out, background 0.3s"
                                      }} className="group-hover:brightness-110 transition-all" />
                                    </div>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
