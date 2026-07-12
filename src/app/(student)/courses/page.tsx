"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { BookOpen, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function CoursesPage() {
  const { convexUserId, isLoading: userLoading } = useConvexUser();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const courses = useQuery(api.courses.listPublishedCourses);
  const enrollments = useQuery(
    api.enrollments.getUserEnrollments,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const enrollUser = useMutation(api.enrollments.enrollUser);

  const isLoading = userLoading || courses === undefined || enrollments === undefined;

  const handleEnroll = async (courseId: string) => {
    if (!convexUserId) return;
    setEnrollingId(courseId);
    try {
      await enrollUser({ userId: convexUserId, courseId: courseId as Id<"courses"> });
    } finally {
      setEnrollingId(null);
    }
  };

  const enrolledCourseIds = new Set(
    enrollments?.map(e => e.course?._id).filter(Boolean) || []
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "6rem", height: "100vh", alignItems: "center" }}>
        <Loader2 className="animate-spin text-muted" size={32} />
      </div>
    );
  }

  const enrolledCourses = courses?.filter(c => enrolledCourseIds.has(c._id)) || [];
  const availableCourses = courses?.filter(c => !enrolledCourseIds.has(c._id)) || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "6rem" }}>
      
      {/* ─── Hero Section ─── */}
      <div style={{ padding: "4rem 0 3rem 0", borderBottom: "1px solid var(--border)", marginBottom: "3rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--text-primary)" }}>
          Your <span style={{ color: "var(--accent)" }}>Courses</span>.
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontSize: "1.125rem", maxWidth: 600, lineHeight: 1.6 }}>
          Master concepts with structured batches designed for rigorous preparation and adaptive memory retention.
        </p>
      </div>

      {/* ─── Enrolled Courses ─── */}
      {enrolledCourses.length > 0 && (
        <div style={{ marginBottom: "5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={24} className="text-success" /> Active Enrollments
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {enrolledCourses.map(course => (
              <div 
                key={course._id} 
                style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "16px", 
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, border-color 0.2s"
                }}
                className="group hover:border-[var(--accent)] hover:-translate-y-1"
              >
                {/* Decorative Background Element */}
                <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.05, transform: "rotate(15deg)" }}>
                  <BookOpen size={120} />
                </div>

                <div style={{ flex: 1, zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)", fontWeight: 600 }}>Enrolled</span>
                    {course.priceTier === "premium" && <span className="badge-premium">PRO</span>}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {course.name}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                    {course.description || "Continue your preparation path."}
                  </p>
                </div>

                <Link 
                  href={`/classroom?courseId=${course._id}`} 
                  className="btn btn-primary" 
                  style={{ width: "100%", justifyContent: "center", zIndex: 1, height: "48px", fontSize: "1rem" }}
                >
                  Enter Classroom
                  <ChevronRight size={18} style={{ marginLeft: "0.5rem" }} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Available Courses ─── */}
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
          Explore More Courses
        </h2>
        
        {availableCourses.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "16px", color: "var(--text-muted)" }}>
            <BookOpen size={32} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
            <p>You&apos;re enrolled in all available courses!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {availableCourses.map((course) => {
              const isEnrolling = enrollingId === course._id;
              
              return (
                <div key={course._id} style={{ 
                  background: "transparent", 
                  border: "1px solid var(--border)", 
                  borderRadius: "16px", 
                  padding: "1.5rem",
                  display: "flex", 
                  flexDirection: "column" 
                }}>
                  <div style={{ marginBottom: "1.5rem", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={20} className="text-muted" />
                      </div>
                      {course.priceTier === "premium" ? (
                        <span className="badge-premium" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "100px" }}>PREMIUM</span>
                      ) : (
                        <span className="badge-free" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "100px" }}>FREE</span>
                      )}
                    </div>
                    
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                      {course.name}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {course.description || "Master this subject with structured learning."}
                    </p>
                  </div>

                  <button 
                    className="btn btn-ghost" 
                    style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                    onClick={() => handleEnroll(course._id)}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? <Loader2 size={16} className="animate-spin" /> : "Enroll Now"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
