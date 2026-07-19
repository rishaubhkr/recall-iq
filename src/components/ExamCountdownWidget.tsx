"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Target, Calendar, ChevronRight, X } from "lucide-react";

interface Props {
  userId: Id<"users"> | undefined;
  todayReviews?: number;
}

const EXAMS = [
  { name: "JEE 2026",   date: "2026-04-05" },
  { name: "NEET 2026",  date: "2026-05-03" },
  { name: "GATE 2026",  date: "2026-02-01" },
  { name: "Custom",     date: "" },
];

export function ExamCountdownWidget({ userId, todayReviews = 0 }: Props) {
  const [showSetup, setShowSetup] = useState(false);
  const [examName, setExamName] = useState("JEE 2026");
  const [examDate, setExamDate] = useState("2026-04-05");
  const [dailyGoal, setDailyGoal] = useState(30);
  const [customDate, setCustomDate] = useState("");

  const settings = useQuery(
    api.notifications.getExamSettings,
    userId ? { userId } : "skip"
  );
  const predictedScoreData = useQuery(
    api.analytics.getPredictedScore,
    userId ? { userId } : "skip"
  );
  const saveSettings = useMutation(api.notifications.saveExamSettings);

  // Sync from Convex on load
  useEffect(() => {
    if (settings) {
      setExamName(settings.examName);
      setExamDate(settings.examDate);
      setDailyGoal(settings.dailyCardGoal);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!userId) return;
    const finalDate = examName === "Custom" ? customDate : examDate;
    await saveSettings({ userId, examName, examDate: finalDate, dailyCardGoal: dailyGoal });
    setShowSetup(false);
  };

  // Compute days remaining
  const targetDate = settings?.examDate ?? examDate;
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / 86_400_000
  ));
  const totalDays = settings
    ? Math.ceil((new Date(targetDate).getTime() - new Date(settings.createdAt ?? Date.now() - 365 * 86_400_000).getTime()) / 86_400_000)
    : 365;
  const progressPct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  // Urgency color
  const urgencyColor = daysLeft <= 30 ? "#EF4444" : daysLeft <= 90 ? "#F59E0B" : "#10B981";

  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((todayReviews / dailyGoal) * 100)) : 0;

  // First-time — no settings yet
  if (!settings && settings !== undefined) {
    return (
      <div
        onClick={() => setShowSetup(true)}
        style={{
          background: "linear-gradient(145deg, #0F1A2E, #0F172A)",
          border: "1px dashed rgba(255,255,255,0.15)",
          borderRadius: 20, padding: "1.5rem 2rem",
          cursor: "pointer", textAlign: "center",
          transition: "all 0.2s ease",
        }}
        className="hover:border-white/30"
      >
        <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎯</p>
        <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Set Your Exam Date</p>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Track days left to JEE, NEET, or GATE</p>
      </div>
    );
  }

  return (
    <>
      {/* Setup Modal */}
      {showSetup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowSetup(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 24, padding: "2rem", width: "min(420px, 92vw)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)", margin: 0 }}>🎯 Set Your Target Exam</h3>
              <button onClick={() => setShowSetup(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Exam picker */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Exam</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {EXAMS.map((e) => (
                    <button
                      key={e.name}
                      onClick={() => { setExamName(e.name); if (e.date) setExamDate(e.date); }}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                        background: examName === e.name ? "var(--accent)" : "rgba(255,255,255,0.07)",
                        color: examName === e.name ? "#000" : "var(--text-primary)",
                        border: `1px solid ${examName === e.name ? "var(--accent)" : "rgba(255,255,255,0.12)"}`,
                      }}
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date input */}
              {examName === "Custom" && (
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Custom Date</label>
                  <input
                    type="date" value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    style={{
                      marginTop: "0.5rem", display: "block", width: "100%", padding: "0.75rem",
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10, color: "var(--text-primary)", fontSize: "0.95rem",
                    }}
                  />
                </div>
              )}

              {/* Daily goal */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Daily Card Goal</label>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {[10, 20, 30, 50, 100].map((g) => (
                    <button
                      key={g} onClick={() => setDailyGoal(g)}
                      style={{
                        flex: 1, padding: "0.6rem 0", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                        background: dailyGoal === g ? "var(--accent)" : "rgba(255,255,255,0.07)",
                        color: dailyGoal === g ? "#000" : "var(--text-primary)",
                        border: `1px solid ${dailyGoal === g ? "var(--accent)" : "rgba(255,255,255,0.12)"}`,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                style={{
                  background: "var(--accent)", color: "#000",
                  border: "none", borderRadius: 12, padding: "0.9rem",
                  fontSize: "1rem", fontWeight: 700, cursor: "pointer", marginTop: "0.5rem",
                }}
              >
                Save Commitment ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Card */}
      <div style={{
        background: "linear-gradient(145deg, #0D1B2A, #0F172A)",
        border: `1px solid ${urgencyColor}30`,
        borderRadius: 20, padding: "1.5rem 2rem",
        boxShadow: `0 0 40px ${urgencyColor}08`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {settings?.examName ?? examName}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: urgencyColor, lineHeight: 1 }}>{daysLeft}</span>
              <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>days left</span>
            </div>
          </div>
          <button onClick={() => setShowSetup(true)} style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "0.5rem 0.75rem", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600,
          }}>
            Edit
          </button>
        </div>

        {/* Countdown progress bar */}
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden", marginBottom: "1.25rem" }}>
          <div style={{
            height: "100%", width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${urgencyColor}, ${urgencyColor}aa)`,
            borderRadius: 100, transition: "width 1s ease",
          }} />
        </div>

        {/* Daily goal tracker */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: predictedScoreData ? "1.25rem" : 0 }}>
          <Target size={14} color="rgba(255,255,255,0.4)" />
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${goalPct}%`,
              background: goalPct >= 100 ? "#10B981" : "var(--accent)",
              borderRadius: 100, transition: "width 0.6s ease",
            }} />
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap" }}>
            {todayReviews} / {settings?.dailyCardGoal ?? dailyGoal} today
          </span>
        </div>

        {/* Predicted Exam Score (Phase 3) */}
        {predictedScoreData && (
          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Predicted {predictedScoreData.examName.split(" ")[0]} Score
              </p>
              <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--chemistry)", marginTop: "0.25rem" }}>
                {predictedScoreData.score} <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>({predictedScoreData.range})</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Syllabus Coverage
              </p>
              <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--info)", marginTop: "0.25rem" }}>
                {predictedScoreData.coverage}%
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
