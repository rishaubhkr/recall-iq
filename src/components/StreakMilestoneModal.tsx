"use client";

import { useEffect, useState } from "react";

const MILESTONES = [7, 30, 100, 365];

interface Props {
  streak: number;
  longestStreak: number;
}

export function StreakMilestoneModal({ streak, longestStreak }: Props) {
  const [visible, setVisible] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const hit = MILESTONES.find(
      (m) => streak === m && longestStreak <= m && !dismissed.has(m)
    );
    if (hit) {
      setMilestone(hit);
      setVisible(true);
      // Auto-dismiss after 5s
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [streak, longestStreak, dismissed]);

  const dismiss = () => {
    if (milestone) setDismissed((prev) => new Set(prev).add(milestone));
    setVisible(false);
  };

  if (!visible || !milestone) return null;

  const config: Record<number, { emoji: string; title: string; sub: string; color: string }> = {
    7:   { emoji: "🔥", title: "One Week Warrior!", sub: "You've studied 7 days straight. Most students quit by day 3.", color: "#F59E0B" },
    30:  { emoji: "⚡", title: "Month of Mastery!", sub: "30-day streak. You're now in the top 15% of all RecallIQ students.", color: "#10B981" },
    100: { emoji: "💎", title: "100 Days. Legendary.", sub: "You are in the top 1%. Your memory is measurably stronger.", color: "#818CF8" },
    365: { emoji: "🏆", title: "One Full Year!", sub: "365 consecutive days. A truly extraordinary achievement.", color: "#F59E0B" },
  };

  const { emoji, title, sub, color } = config[milestone] ?? config[7];

  return (
    <>
      <style>{`
        @keyframes milestone-in {
          0%  { opacity: 0; transform: scale(0.85) translateY(20px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes milestone-bg {
          0%  { opacity: 0; }
          100%{ opacity: 1; }
        }
        @keyframes particle-rise {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-160px) rotate(720deg) scale(0); opacity: 0; }
        }
        .milestone-particle {
          position: absolute;
          border-radius: 50%;
          animation: particle-rise 1.5s ease-out forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "milestone-bg 0.3s ease forwards",
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            background: "linear-gradient(145deg, #0F172A, #1E293B)",
            border: `2px solid ${color}`,
            borderRadius: 28,
            padding: "3rem 3.5rem",
            maxWidth: 480,
            width: "90%",
            textAlign: "center",
            boxShadow: `0 0 80px ${color}30, 0 40px 80px rgba(0,0,0,0.6)`,
            animation: "milestone-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
            overflow: "hidden",
          }}
        >
          {/* Particle burst */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="milestone-particle"
              style={{
                width: 10 + (i % 3) * 4,
                height: 10 + (i % 3) * 4,
                background: i % 2 === 0 ? color : "#fff",
                bottom: "20%",
                left: `${10 + i * 7}%`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${1.2 + (i % 4) * 0.3}s`,
              }}
            />
          ))}

          {/* Glow ring */}
          <div style={{
            position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
            width: 300, height: 300,
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            borderRadius: "50%", pointerEvents: "none",
          }} />

          <div style={{ fontSize: "5rem", lineHeight: 1, marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
            {emoji}
          </div>
          <h2 style={{
            fontSize: "2rem", fontWeight: 700, color: "#fff",
            letterSpacing: "-0.02em", marginBottom: "0.75rem", position: "relative", zIndex: 1,
          }}>
            {title}
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.65)", fontSize: "1rem", lineHeight: 1.6,
            marginBottom: "2rem", position: "relative", zIndex: 1,
          }}>
            {sub}
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: `${color}20`, border: `1px solid ${color}40`,
            borderRadius: 100, padding: "0.5rem 1.5rem", marginBottom: "2rem",
            position: "relative", zIndex: 1,
          }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color }}>🔥 {milestone}</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Day Streak</span>
          </div>

          <button
            onClick={dismiss}
            style={{
              display: "block", width: "100%",
              background: color, color: "#000",
              border: "none", borderRadius: 14,
              padding: "0.9rem", fontSize: "1rem", fontWeight: 700,
              cursor: "pointer", position: "relative", zIndex: 1,
              boxShadow: `0 8px 24px ${color}40`,
            }}
          >
            Keep Going! 💪
          </button>
        </div>
      </div>
    </>
  );
}
