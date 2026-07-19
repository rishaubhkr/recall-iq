"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Flame, Brain, Target, TrendingUp, BookOpen, Zap, Loader2, HelpCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { StreakMilestoneModal } from "@/components/StreakMilestoneModal";
import { ExamCountdownWidget } from "@/components/ExamCountdownWidget";
import { PushNotificationCard } from "@/components/PushNotificationCard";
import { WeeklyReportWidget } from "@/components/WeeklyReportWidget";

// ── Streak Health Bar ─────────────────────────────────────────────────────────
function StreakHealthBar({ streak, shields }: { streak: number; shields: number }) {
  const now = new Date();
  // IST offset = UTC+5:30 → use hour in IST
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  // Health depletes after 6 PM IST (18:00)
  const health = istHour >= 18 ? Math.max(10, 100 - (istHour - 18) * 25) : 100;
  const atRisk = health < 100;
  const barColor = health > 60 ? "#F59E0B" : health > 30 ? "#F97316" : "#EF4444";

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: `1px solid ${atRisk ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 20, padding: "1.25rem 1.5rem",
      boxShadow: atRisk ? "0 0 20px rgba(239,68,68,0.08)" : "0 8px 24px -8px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Flame size={20} color={barColor} />
          <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Day Streak</span>
        </div>
        {shields > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: Math.min(shields, 5) }).map((_, i) => (
              <Shield key={i} size={14} color="#818CF8" fill="#818CF8" />
            ))}
          </div>
        )}
      </div>
      {/* Health bar */}
      <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${health}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          borderRadius: 100,
          transition: "width 1s ease, background 0.5s ease",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "rgba(255,255,255,0.25)", borderRadius: "inherit" }} />
        </div>
      </div>
      {atRisk && (
        <p style={{ fontSize: "0.7rem", color: "#EF4444", marginTop: "0.4rem", fontWeight: 600 }}>
          ⚠️ Study now to protect your streak!
        </p>
      )}
    </div>
  );
}

// ── Memory Score Gauge ────────────────────────────────────────────────────────
function MemoryScoreCard({ score, isLoading }: { score: number; isLoading: boolean }) {
  const pct = score / 1000;
  const color = score >= 700 ? "#10B981" : score >= 400 ? "#F59E0B" : "#818CF8";
  const rank = score >= 800 ? "Top 5%" : score >= 600 ? "Top 20%" : score >= 400 ? "Top 40%" : "Building…";

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "1.25rem 1.5rem",
      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: "1rem",
    }}>
      {/* Circular gauge */}
      <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
        <svg width={52} height={52} viewBox="0 0 52 52">
          <circle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
          <circle
            cx={26} cy={26} r={22} fill="none"
            stroke={color} strokeWidth={5}
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct)}`}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <Brain size={16} color={color} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      </div>
      <div>
        <p style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1, color: "var(--text-primary)" }}>
          {isLoading ? "…" : score}
        </p>
        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
          Memory Score
          <span style={{ color, marginLeft: 6, fontWeight: 800 }}>{!isLoading && `· ${rank}`}</span>
        </p>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, color, description, className }: {
  icon: typeof Flame; value: string | number; label: string; color: string; description: string; className?: string;
}) {
  return (
    <div className={className} style={{
      display: "flex", alignItems: "center", gap: "1.25rem", height: "100%",
      background: "var(--bg-elevated)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "1.25rem 1.5rem",
      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)"
    }}>
      <div style={{
        width: 44, height: 44, background: `color-mix(in srgb, ${color} 12%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "12px", flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: "1.75rem", fontWeight: 600, fontFamily: "var(--font-display)", lineHeight: 1, color: "var(--text-primary)" }}>{value}</p>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {label}
          <span className="tooltip-container" style={{ display: "inline-flex", cursor: "help" }}>
            <HelpCircle size={12} color="rgba(255,255,255,0.4)" />
            <span className="tooltip-content">{description}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Activity Bar ──────────────────────────────────────────────────────────────
function ActivityBar({ day, count, max }: { day: string; count: number; max: number }) {
  const h = max > 0 ? Math.round((count / max) * 60) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{
        width: "100%", maxWidth: "32px", height: 70, display: "flex", alignItems: "flex-end",
        borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.04)"
      }}>
        <div style={{
          width: "100%", height: h, background: "linear-gradient(180deg, var(--accent) 0%, #B45309 100%)",
          borderRadius: "8px", transition: "height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }} />
      </div>
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{day.slice(5)}</span>
    </div>
  );
}

// ── Brain Report Card ─────────────────────────────────────────────────────────
function BrainReportCard({ insights, isLoading }: {
  insights: { emoji: string; text: string }[];
  isLoading: boolean;
}) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #0F1E1A 0%, #0F172A 100%)",
      border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: 20, padding: "1.5rem 2rem",
    }}>
      <p style={{ fontWeight: 700, fontSize: "0.75rem", color: "#10B981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
        🧠 Today's Brain Report
      </p>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)" }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading insights…
        </div>
      ) : insights.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No insights yet — start a session!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>{ins.emoji}</span>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: 0 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();
  const { convexUserId, streak, longestStreak, shields, isLoading } = useConvexUser();

  const stats = useQuery(api.analytics.getStudentStats, convexUserId ? { userId: convexUserId } : "skip");
  const memoryScoreData = useQuery(api.analytics.getMemoryScore, convexUserId ? { userId: convexUserId } : "skip");
  const brainReport = useQuery(api.analytics.getDailyBrainReport, convexUserId ? { userId: convexUserId } : "skip");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const dailyMap = stats?.dailyActivity ?? {};
  const maxActivity = Math.max(1, ...Object.values(dailyMap));

  const calibrationGap = stats
    ? Math.abs(stats.avgConfidence - stats.accuracy / 20).toFixed(1)
    : "—";

  const memoryScore = memoryScoreData?.score ?? 0;
  const insights = brainReport?.insights ?? [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Milestone celebration overlay */}
      <StreakMilestoneModal streak={streak} longestStreak={longestStreak} />

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }} className="animate-in">
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>
          {greeting()}, {user?.firstName ?? "Student"}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2, color: "var(--text-primary)" }}>
          Your Memory<br />
          <span style={{ color: "var(--accent)" }}>
            {isLoading ? "Loading…" : stats?.dueToday ? `${stats.dueToday} Cards Scheduled.` : "Queue is Clear. 🎯"}
          </span>
        </h1>
      </div>

      <style>{`
        .bento-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: stretch; }
        @media (min-width: 768px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-span-2 { grid-column: span 2; }
        }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); }
          .bento-span-4 { grid-column: span 4; }
        }
        .tooltip-container { position: relative; }
        .tooltip-content {
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);
          background: #000; color: #fff; padding: 0.75rem 1rem; border-radius: 10px;
          font-size: 0.7rem; width: 180px; text-align: center; pointer-events: none;
          opacity: 0; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 100;
          border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          line-height: 1.4; text-transform: none; letter-spacing: normal;
        }
        .tooltip-container:hover .tooltip-content { opacity: 1; transform: translateX(-50%) translateY(-12px); }
      `}</style>

      <div className="bento-grid">

        {/* ── Row 1: Activity chart + Study CTA ── */}
        <div className="bento-span-2" style={{
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "2rem",
        }}>
          <p style={{ fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "1.5rem", fontSize: "1.15rem", display: "flex", alignItems: "center", color: "var(--text-primary)" }}>
            7-Day Activity
            {isLoading && <Loader2 size={16} style={{ marginLeft: 12, animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flex: 1, justifyContent: "space-between" }}>
            {last7Days.map((key) => (
              <ActivityBar key={key} day={key} count={dailyMap[key] ?? 0} max={maxActivity} />
            ))}
          </div>
        </div>

        {/* Study CTA */}
        <div className="bento-span-2" style={{
          background: "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem",
          display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-50%", right: "-20%", width: "100%", height: "200%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.75rem", color: "var(--text-primary)" }}>
              Start Today&apos;s Session
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 8, fontWeight: 500 }}>
              {stats?.dueToday ? `${stats.dueToday} cards due · spaced repetition queue` : "Spaced repetition queue — mixed subjects"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <Link href="/study" className="btn hover:scale-[1.02] transition-transform" style={{
              background: "var(--accent)", color: "#000", fontSize: "1.05rem", padding: "0.85rem 2rem",
              display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, borderRadius: "12px",
              boxShadow: "0 8px 16px rgba(245,158,11,0.2)", textDecoration: "none",
            }}>
              <Zap size={18} fill="currentColor" /> Study Now
            </Link>
            {/* Quick 5 — Minimum Viable Session */}
            <Link href="/study?limit=5" className="btn hover:scale-[1.02] transition-transform" style={{
              background: "rgba(255,255,255,0.07)", color: "var(--text-primary)", fontSize: "0.9rem",
              padding: "0.85rem 1.25rem", display: "inline-flex", alignItems: "center", gap: "0.5rem",
              fontWeight: 600, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
            }}>
              ⚡ Quick 5
            </Link>
          </div>
        </div>

        {/* ── Row 2: Stats row ── */}
        {/* Streak Health Bar (spans 1 cell) */}
        <StreakHealthBar streak={isLoading ? 0 : streak} shields={isLoading ? 0 : shields} />

        {/* Memory Score */}
        <MemoryScoreCard score={isLoading ? 0 : memoryScore} isLoading={isLoading || memoryScoreData === undefined} />

        <StatCard
          icon={Target} value={isLoading ? "…" : stats ? `${stats.accuracy}%` : "—"} label="Accuracy (7d)" color="var(--success)"
          description="The percentage of cards you answered correctly over the last 7 days."
        />
        <StatCard
          icon={TrendingUp} value={isLoading ? "…" : calibrationGap} label="Calibration gap" color="var(--chemistry)"
          description="The difference between your perceived confidence and actual performance. Lower is better."
        />

        {/* ── Row 3: Brain Report + Exam Countdown / Push ── */}
        <div className="bento-span-2">
          <BrainReportCard insights={insights} isLoading={isLoading || brainReport === undefined} />
        </div>

        <div className="bento-span-2" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <PushNotificationCard userId={convexUserId} />
          <WeeklyReportWidget userId={convexUserId} />
          <ExamCountdownWidget
            userId={convexUserId}
            todayReviews={Object.values(dailyMap).slice(-1)[0] ?? 0}
          />
        </div>

        {/* ── Row 4: Quick Action Links ── */}
        <div className="bento-span-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { href: "/study?mode=spaced", icon: Brain, title: "Due Cards", sub: "Spaced repetition queue", color: "var(--accent)" },
            { href: "/study?mode=interleaved", icon: BookOpen, title: "Mixed Session", sub: "Cross-subject interleaving", color: "var(--chemistry)" },
            { href: "/subjects", icon: Target, title: "Browse Topics", sub: "Full syllabus explorer", color: "var(--info)" },
          ].map(({ href, icon: Icon, title, sub, color }) => (
            <Link key={href} href={href} style={{
              textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem",
              background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: `3px solid ${color}`, borderRadius: "14px", padding: "1.25rem 1.5rem",
              transition: "all 0.18s ease",
            }} className="hover:border-white/20 hover:scale-[1.02] hover:shadow-lg">
              <div style={{
                width: 42, height: 42, borderRadius: "12px",
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{title}</p>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 2, fontWeight: 500 }}>{sub}</p>
              </div>
              <span style={{ color, opacity: 0.7, flexShrink: 0, fontSize: "1.1rem" }}>›</span>
            </Link>
          ))}
        </div>

        {/* ── Row 5: Topic Mastery Pills ── */}
        {stats?.topicMastery && stats.topicMastery.length > 0 && (
          <div className="bento-span-4" style={{ marginTop: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
              Recent Topic Mastery
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
              {stats.topicMastery.map((topic) => {
                const accColor = topic.accuracy >= 90 ? "#10B981" : topic.accuracy >= 70 ? "#F59E0B" : "#EF4444";
                return (
                  <div key={topic.id} style={{
                    padding: "0.9rem 1.4rem", background: "var(--bg-elevated)", borderRadius: "100px",
                    border: `2px solid ${topic.isBlooming ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    boxShadow: topic.isBlooming ? "0 0 24px rgba(245,158,11,0.25)" : "none",
                  }} className={topic.isBlooming ? "bloom-shimmer" : ""}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: topic.isBlooming ? "var(--accent)" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: topic.isBlooming ? "var(--text-primary)" : "rgba(255,255,255,0.75)" }}>
                      {topic.name}
                    </span>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700, background: `${accColor}18`,
                      padding: "3px 8px", borderRadius: "100px", color: accColor,
                      border: `1px solid ${accColor}30`, letterSpacing: "0.02em",
                    }}>
                      {topic.accuracy}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
