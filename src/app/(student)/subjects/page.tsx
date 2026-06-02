"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { BookOpen, Lock, Loader2, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { SubtopicList } from "@/components/subjects/SubtopicList";

const SUBJECT_COLORS: Record<string, string> = {
  physics:    "#3B82F6",
  chemistry:  "#F59E0B",
  mathematics:"#F59E0B",
  maths:      "#F59E0B",
  biology:    "#10B981",
  science:    "#10B981", // Removed Indigo pollutant
};

interface SubjectCardProps {
  subject: any;
  userTier: "free" | "premium" | "admin";
}

function SubjectCard({ subject, userTier }: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = "var(--accent)"; // Unified to brand accent
  const subjectSpecificColor = SUBJECT_COLORS[subject.slug] || color;
  const topicCount = subject.topics.length;

  return (
    <div 
      className={`glass-card ${isExpanded ? "" : "glass-card-hover"}`}
      style={{ 
        padding: "1.5rem", 
        borderRadius: "20px",
        border: isExpanded ? `1px solid var(--border-accent)` : "1px solid rgba(255,255,255,0.04)",
        background: isExpanded ? "rgba(15, 22, 26, 0.9)" : "var(--bg-card)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Accent Light */}
      {isExpanded && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.5
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "14px",
            background: "rgba(245, 158, 11, 0.08)", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            boxShadow: "inset 0 0 10px rgba(245, 158, 11, 0.05)"
          }}>
            <BookOpen size={22} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.15rem", color: "var(--text-primary)", letterSpacing: "0.02em" }}>{subject.name.toUpperCase()}</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {topicCount} module{topicCount !== 1 ? "s" : ""} • SYLLABUS EXPLORER
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn ${isExpanded ? "btn-primary" : "btn-ghost"}`}
          style={{ 
            padding: "0.5rem 1.25rem",
            fontSize: "0.75rem",
            borderRadius: "10px",
            minWidth: 80
          }}
        >
          {isExpanded ? "CLOSE" : "EXPLORE"}
        </button>
      </div>

      {isExpanded ? (
        <div className="animate-in" style={{ marginTop: "1.5rem" }}>
          <SubtopicList topics={subject.topics} subjectColor={color} userTier={userTier} />
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
            <Link href={`/study?mode=subject&subject=${subject.slug}`} className="btn btn-primary" style={{ flex: 1, padding: "1rem" }}>
              INITIALIZE MASTERY SESSION
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
           <div style={{ height: 3, flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "45%", background: "var(--accent)", borderRadius: 10, opacity: 0.6 }} />
           </div>
           <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em" }}>45% MASTERED</span>
        </div>
      )}
    </div>
  );
}

export default function SubjectsPage() {
  const { convexUser, tier, isLoading: userLoading } = useConvexUser();
  const exams = useQuery(api.subjects.listExams);
  const [activeExamId, setActiveExamId] = useState<Id<"exams"> | null>(null);

  useEffect(() => {
    if (exams && exams.length > 0 && !activeExamId) {
      const saved = localStorage.getItem("recalliq_default_exam") as Id<"exams"> | null;
      if (saved && exams.some(e => e._id === saved)) {
        setActiveExamId(saved);
      } else {
        setActiveExamId(exams[0]._id);
      }
    }
  }, [exams, activeExamId]);

  const tree = useQuery(
    api.subjects.getFullTree,
    activeExamId ? { examId: activeExamId, userId: convexUser?._id } : "skip",
  );

  const isLoading = userLoading || exams === undefined || tree === undefined || !activeExamId;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1.5rem", background: "var(--bg-primary)" }}>
        <Loader2 size={40} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", fontSize: "0.75rem" }}>Synthesizing Knowledge Tree</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840, width: "100%", margin: "0 auto", paddingBottom: "6rem", paddingTop: "2rem" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "4rem", textAlign: "center" }} className="animate-in">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 1rem", background: "rgba(245, 158, 11, 0.05)", borderRadius: "var(--radius-pill)", border: "1px solid rgba(245, 158, 11, 0.15)", marginBottom: "1.5rem" }}>
          <Sparkles size={14} color="var(--accent)" />
          <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)" }}>
            Curriculum Matrix
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, textTransform: "uppercase" }}>
          Syllabus <span style={{ color: "var(--accent)" }}>Explorer</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginTop: "1rem", fontWeight: 500, maxWidth: 500, margin: "1rem auto 0" }}>
          Deconstruct the syllabus into high-retention modules. Master each subtopic with surgical precision.
        </p>
      </div>

      {/* ── EXAM TABS ── */}
      <div style={{ 
        display: "flex", 
        gap: "0.5rem", 
        marginBottom: "3rem", 
        background: "rgba(15, 22, 26, 0.8)", 
        padding: "0.5rem", 
        borderRadius: "16px",
        width: "fit-content",
        margin: "0 auto 3rem",
        border: "1px solid rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)"
      }}>
        {exams?.map((exam) => (
          <button
            key={exam._id}
            onClick={() => {
              setActiveExamId(exam._id);
              localStorage.setItem("recalliq_default_exam", exam._id);
            }}
            className={activeExamId === exam._id ? "btn btn-primary" : "btn btn-ghost"}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "12px",
              fontSize: "0.8rem",
              minWidth: 120
            }}
          >
            {exam.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── SUBJECT GRID ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {tree?.map((subject: any) => (
          <SubjectCard key={subject._id} subject={subject} userTier={tier as any} />
        ))}
      </div>

      {/* ── PREMIUM UPGRADE BANNER ── */}
      {tier === "free" && (
        <div className="glass-card aura-gold" style={{ 
          marginTop: "4rem", 
          padding: "2rem", 
          borderRadius: "24px", 
          textAlign: "center",
          border: "1px solid var(--accent-amber)"
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Unlock Full Syllabus 🔓
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Get access to 5,000+ premium cards and personalized subtopic analytics.
          </p>
          <Link href="/upgrade" className="btn btn-primary" style={{ background: "var(--accent-amber)", color: "#000" }}>
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}
