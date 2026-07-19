"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Brain, Sparkles, Calendar, ArrowRight, Loader2, X } from "lucide-react";

interface Props {
  userId: Id<"users"> | undefined;
}

export function WeeklyReportWidget({ userId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Helper: get ISO YYYY-MM-DD of the current week's Monday
  const getMostRecentMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const weekStartDate = getMostRecentMonday();

  const report = useQuery(
    api.analytics.getWeeklyAiReport,
    userId ? { userId, weekStartDate } : "skip"
  );

  const generateReport = useAction(api.ai.generateWeeklyAiReport);

  const handleGenerate = async () => {
    if (!userId) return;
    setGenerating(true);
    try {
      await generateReport({ userId, weekStartDate });
      setIsOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Custom Markdown renderer for styling the AI text without heavy dependencies
  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        return (
          <h3
            key={i}
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--accent)",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
            }}
          >
            {trimmed.slice(3)}
          </h3>
        );
      }
      if (trimmed.startsWith("- ")) {
        return (
          <li
            key={i}
            style={{
              marginLeft: "1.25rem",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            {trimmed.slice(2)}
          </li>
        );
      }
      if (trimmed === "") {
        return <div key={i} style={{ height: "0.75rem" }} />;
      }
      
      // Bold rendering within paragraph
      let content: React.ReactNode = trimmed;
      if (trimmed.includes("**")) {
        const parts = trimmed.split("**");
        content = parts.map((part, index) => 
          index % 2 === 1 ? <strong key={index} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{part}</strong> : part
        );
      }

      return (
        <p
          key={i}
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "0.75rem",
          }}
        >
          {content}
        </p>
      );
    });
  };

  if (!userId) return null;

  return (
    <>
      {/* Trigger Card */}
      <div
        style={{
          background: "linear-gradient(145deg, #0F172A, #090D1A)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 20,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "1.25rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glow */}
        <div style={{ position: "absolute", top: "-50%", right: "-20%", width: "100%", height: "200%", background: "radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🧠</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Weekly Coaching
            </p>
          </div>
          <h4 style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>
            AI Brain Report
          </h4>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: 6, lineHeight: 1.4 }}>
            {report 
              ? "Your weekly cognitive summary & coaching recommendations are ready." 
              : "Get Gemini-powered insights on your FSRS stability & memory performance."}
          </p>
        </div>

        <button
          onClick={report ? () => setIsOpen(true) : handleGenerate}
          disabled={generating}
          style={{
            background: report ? "rgba(255, 255, 255, 0.07)" : "linear-gradient(90deg, #8B5CF6, #EC4899)",
            color: report ? "var(--text-primary)" : "#FFF",
            border: `1px solid ${report ? "rgba(255,255,255,0.12)" : "transparent"}`,
            borderRadius: 12,
            padding: "0.75rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
            width: "100%",
            zIndex: 1,
          }}
          className="hover:scale-[1.01]"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Analyzing stats…
            </>
          ) : report ? (
            <>
              View Coaching Insights <ArrowRight size={16} />
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate Report
            </>
          )}
        </button>
      </div>

      {/* Modal */}
      {isOpen && report && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#090D1A",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 24,
              width: "min(680px, 100%)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              animation: "scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={16} color="var(--accent)" />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    JEE/NEET Cognitive Coach
                  </span>
                </div>
                <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: 700, color: "#FFF" }}>
                  Weekly AI Brain Report
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "2rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <Calendar size={14} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  Report Week: {new Date(report.weekStartDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {renderMarkdown(report.summary)}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Got it, Coach!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
