"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Flame, Brain, Target, TrendingUp, BookOpen, Zap, Loader2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

function StatCard({ icon: Icon, value, label, color, description, className }: {
  icon: typeof Flame; value: string | number; label: string; color: string; description: string; className?: string;
}) {
  return (
    <div className={className} style={{ 
      display: "flex", alignItems: "center", gap: "1.25rem", height: "100%", 
      background: "var(--bg-elevated)", 
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "20px",
      padding: "1.25rem 1.5rem",
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
        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {label}
          <span className="tooltip-container" style={{ display: "inline-flex", cursor: "help" }}>
            <HelpCircle size={12} color="var(--text-muted)" />
            <span className="tooltip-content">{description}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

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

export default function DashboardPage() {
  const { user } = useUser();
  const { convexUserId, streak, isLoading } = useConvexUser();

  // Live Convex stats — skip until we have a userId
  const stats = useQuery(
    api.analytics.getStudentStats,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Build 7-day activity map
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // eslint-disable-next-line react-hooks/purity
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const dailyMap = stats?.dailyActivity ?? {};
  const maxActivity = Math.max(1, ...Object.values(dailyMap));

  // Calibration gap = |avgConfidence - (accuracy/20)| (simple 1-5 vs 0-100 scale)
  const calibrationGap = stats
    ? Math.abs(stats.avgConfidence - stats.accuracy / 20).toFixed(1)
    : "—";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem" }} className="animate-in">
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>
          {greeting()}, {user?.firstName ?? "Student"}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2, color: "var(--text-primary)" }}>
          Your Review<br />
          <span style={{ color: "var(--accent)" }}>
            {isLoading ? "Loading…" : stats?.dueToday ? `${stats.dueToday} Cards Due.` : "Queue is Ready."}
          </span>
        </h1>
      </div>

      <style>{`
        .bento-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; align-items: stretch; }
        @media (min-width: 768px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-span-2 { grid-column: span 2; }
        }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); }
          .bento-span-4 { grid-column: span 4; }
        }
        
        /* Tooltip */
        .tooltip-container { position: relative; }
        .tooltip-content {
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);
          background: #000; color: #fff; padding: 0.75rem 1rem; border-radius: 10px;
          font-size: 0.7rem; width: 180px; text-align: center; pointer-events: none;
          opacity: 0; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 100;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          line-height: 1.4; text-transform: none; letter-spacing: normal;
        }
        .tooltip-container:hover .tooltip-content { opacity: 1; transform: translateX(-50%) translateY(-12px); }
      `}</style>

      <div className="bento-grid">

        {/* --- Top Row: Activity & CTA --- */}
        {/* Activity bar chart (Span 2) */}
        <div className="bento-span-2" style={{ 
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          background: "var(--bg-elevated)", 
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "2rem",
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

        {/* CTA (Span 2) */}
        <div className="bento-span-2" style={{
          background: "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "2.5rem",
          display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "2rem",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle amber glow in background */}
          <div style={{ position: "absolute", top: "-50%", right: "-20%", width: "100%", height: "200%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.75rem", color: "var(--text-primary)" }}>
              Start Today&apos;s Session
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 8, fontWeight: 500 }}>
              {stats?.dueToday
                ? `${stats.dueToday} cards due · spaced repetition queue`
                : "Spaced repetition queue — mixed subjects"}
            </p>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <Link href="/study" className="btn hover:scale-[1.02] transition-transform" style={{ 
              background: "var(--accent)", color: "#000", fontSize: "1.05rem", padding: "0.85rem 2rem", width: "max-content", 
              display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, borderRadius: "12px",
              boxShadow: "0 8px 16px rgba(245,158,11,0.2)" 
            }}>
              <Zap size={18} fill="currentColor" /> Study Now
            </Link>
          </div>
        </div>

        {/* --- Middle Row: All 4 Stats in one row --- */}
        <StatCard 
          icon={Flame} value={isLoading ? "…" : streak} label="Day streak" color="var(--accent)" 
          description="Your consecutive days of study. Keep the momentum going to strengthen long-term memory!"
        />
        <StatCard 
          icon={Brain} value={isLoading ? "…" : (stats?.dueToday ?? 0)} label="Due today" color="var(--info)" 
          description="Total cards scheduled for review today based on the FSRS (Spaced Repetition) algorithm."
        />
        <StatCard 
          icon={Target} value={isLoading ? "…" : stats ? `${stats.accuracy}%` : "—"} label="Accuracy (7d)" color="var(--success)" 
          description="The percentage of cards you answered correctly over the last 7 days."
        />
        <StatCard 
          icon={TrendingUp} value={isLoading ? "…" : calibrationGap} label="Calibration gap" color="var(--chemistry)" 
          description="The difference between your perceived confidence and actual performance. Lower is better."
        />

        {/* --- Bottom Row --- */}
        <div className="bento-span-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {[
            { href: "/study?mode=spaced", icon: Brain, title: "Due Cards", sub: "FSRS queue", color: "var(--accent)" },
            { href: "/study?mode=interleaved", icon: BookOpen, title: "Mixed Session", sub: "Interleaved", color: "var(--chemistry)" },
            { href: "/subjects", icon: Target, title: "Browse Topics", sub: "All subjects", color: "var(--info)" },
          ].map(({ href, icon: Icon, title, sub, color }) => (
            <Link key={href} href={href} style={{ 
              textDecoration: "none", display: "flex", alignItems: "center", gap: "1.25rem",
              background: "var(--bg-elevated)", 
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "1.5rem",
              transition: "all 0.2s"
            }} className="hover:border-white/20 hover:scale-[1.02]">
              <div style={{ width: 48, height: 48, borderRadius: "14px", background: `color-mix(in srgb, ${color} 15%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} color={color} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)" }}>{title}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>
        
        {/* --- Visual Bloom (Topic Mastery Nodes) --- */}
        {stats?.topicMastery && stats.topicMastery.length > 0 && (
          <div className="bento-span-4" style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
              Recent Topic Mastery
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {stats.topicMastery.map((topic) => (
                <div 
                  key={topic.id}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: "var(--bg-elevated)",
                    borderRadius: "100px",
                    border: `2px solid ${topic.isBlooming ? "var(--accent)" : "rgba(255,255,255,0.08)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    boxShadow: topic.isBlooming ? "0 0 20px rgba(245, 158, 11, 0.2)" : "none",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  className={topic.isBlooming ? "bloom-shimmer" : ""}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: topic.isBlooming ? "var(--accent)" : "var(--text-muted)" }} />
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: topic.isBlooming ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {topic.name}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-muted)" }}>
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
