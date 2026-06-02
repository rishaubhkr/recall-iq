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
  const courseId = searchParams.get("courseId") as Id<"courses">;

  // We fetch all courses just to get the name, assuming getCourse might not be exposed to students.
  const courses = useQuery(api.courses.listPublishedCourses);
  const course = courses?.find(c => c._id === courseId);

  const { convexUserId } = useConvexUser();
  const tree = useQuery(api.subjects.getFullTree, courseId ? { courseId, userId: convexUserId } : "skip");

  // Keep track of which subjects/topics are expanded
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!courseId || courses === undefined || tree === undefined) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "6rem", height: "100vh", alignItems: "center" }}>
        <Loader2 className="animate-spin text-muted" size={32} />
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Course not found or not published.
      </div>
    );
  }

  const totalCourseCards = tree.reduce((acc, sub) => {
    return acc + sub.topics.reduce((tAcc, top) => {
      return tAcc + top.subtopics.reduce((sAcc, st) => sAcc + st.cardCount, 0);
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

        {tree.map((subject) => {
          const isExpanded = expandedSubjects[subject._id] ?? true;
          const totalSubCards = subject.topics.reduce((acc, t) => acc + t.subtopics.reduce((s, st) => s + st.cardCount, 0), 0);
          const totalSeenCards = subject.topics.reduce((acc, t) => acc + t.subtopics.reduce((s, st) => s + (st.seenCardCount || 0), 0), 0);
          
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
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Link 
                    href={`/study?mode=subject&subjectId=${subject._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost" 
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Study Subject
                  </Link>
                  <ChevronRight size={20} style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </div>
              </div>

              {/* Topics / Chapters */}
              {isExpanded && (
                <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {subject.topics.map(topic => {
                    const isDefaultTopic = topic.slug === "__default__";

                    return (
                      <div key={topic._id} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "1rem" }}>
                        {!isDefaultTopic && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <Book size={16} className="text-muted" />
                              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>{topic.name}</h3>
                            </div>
                            <Link 
                              href={`/study?mode=subject&topicId=${topic._id}`}
                              className="btn" 
                              style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", borderRadius: "100px", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}
                            >
                              Study Chapter
                            </Link>
                          </div>
                        )}

                        {/* Subtopics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
                          {topic.subtopics.map(sub => {
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
                                  gap: "1rem",
                                  padding: "1rem 1rem 1.25rem", 
                                  background: "rgba(255,255,255,0.02)", 
                                  border: "1px solid rgba(255,255,255,0.05)",
                                  borderRadius: "10px", 
                                  textDecoration: "none", 
                                  transition: "all 0.2s",
                                  position: "relative",
                                  overflow: "hidden"
                                }}
                                className="hover:bg-white/5 hover:border-[rgba(255,255,255,0.1)] group"
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                  <div style={{ 
                                    width: 24, 
                                    height: 24, 
                                    borderRadius: "6px", 
                                    background: "rgba(255,255,255,0.03)", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: "2px"
                                  }} className="group-hover:bg-[var(--accent)]/10 transition-colors">
                                    <FileText size={14} className="text-muted group-hover:text-accent transition-colors" />
                                  </div>
                                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.4 }} className="group-hover:text-primary transition-colors">
                                    {sub.name}
                                  </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
                                  <span style={{ 
                                    fontSize: "0.75rem", 
                                    fontWeight: 600,
                                    color: isComplete ? "var(--accent)" : "var(--text-muted)", 
                                    background: isComplete ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.3)", 
                                    padding: "0.2rem 0.5rem", 
                                    borderRadius: "4px" 
                                  }}>
                                    {sub.seenCardCount !== undefined ? `${sub.seenCardCount}/${sub.cardCount}` : sub.cardCount} cards
                                  </span>
                                </div>
                                
                                {/* Micro Progress Bar */}
                                {sub.cardCount > 0 && (
                                  <div style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: "3px",
                                    background: "rgba(255,255,255,0.05)"
                                  }}>
                                    <div style={{
                                      height: "100%",
                                      width: `${progress}%`,
                                      background: isComplete ? "var(--accent)" : "rgba(255,255,255,0.2)",
                                      transition: "width 0.5s ease-out, background 0.3s"
                                    }} className="group-hover:bg-[var(--accent)] transition-colors" />
                                  </div>
                                )}
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
