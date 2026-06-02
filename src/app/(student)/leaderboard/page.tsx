"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Loader2, Trophy, Medal, Crown, Flame, ArrowUp } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)" }}><Loader2 className="animate-spin" size={48} style={{ color: "var(--accent)" }} /></div>}>
      <LeaderboardContent />
    </Suspense>
  );
}

function PodiumItem({ user, rank, delay }: { user: any; rank: number; delay: string }) {
  const isFirst = rank === 1;
  const colors = [
    { border: "#FFD700", glow: "rgba(255, 215, 0, 0.2)", icon: <Crown size={32} fill="#FFD700" color="#FFD700" /> }, // Gold
    { border: "#C0C0C0", glow: "rgba(192, 192, 192, 0.2)", icon: <Medal size={28} fill="#C0C0C0" color="#C0C0C0" /> }, // Silver
    { border: "#CD7F32", glow: "rgba(205, 127, 50, 0.2)", icon: <Medal size={28} fill="#CD7F32" color="#CD7F32" /> }, // Bronze
  ];
  
  const style = colors[rank - 1];

  return (
    <div 
      className="animate-rise" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        gap: "1rem", 
        order: rank === 2 ? 1 : rank === 1 ? 2 : 3,
        animationDelay: delay,
        marginTop: isFirst ? "0" : "2rem"
      }}
    >
      <div style={{ position: "relative" }}>
        <div style={{ 
          width: isFirst ? 100 : 80, 
          height: isFirst ? 100 : 80, 
          borderRadius: "32px", 
          background: "var(--bg-elevated)", 
          border: `3px solid ${style.border}`,
          boxShadow: `0 0 30px ${style.glow}`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontSize: isFirst ? "2.5rem" : "2rem", 
          fontWeight: 600, 
          color: style.border,
          position: "relative",
          zIndex: 2
        }}>
          {user.displayName?.charAt(0).toUpperCase()}
        </div>
        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", zIndex: 3 }}>
          {style.icon}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600, fontSize: isFirst ? "1.25rem" : "1.1rem" }}>{user.displayName}</p>
        <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: isFirst ? "1.5rem" : "1.25rem" }}>{user.xp ?? 0} XP</p>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const { convexUserId } = useConvexUser();
  const leaderboard = useQuery(api.users.getLeaderboard);

  if (leaderboard === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const top3 = (leaderboard ?? []).slice(0, 3);
  const remaining = (leaderboard ?? []).slice(3);
  const currentUser = (leaderboard ?? []).find(u => u._id === convexUserId);
  const currentUserRank = (leaderboard ?? []).findIndex(u => u._id === convexUserId) + 1;

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", background: "var(--bg-primary)", minHeight: "100vh" }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 600, letterSpacing: "-0.04em" }}>
            Global <span style={{ color: "var(--accent)" }}>Elite</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: 500 }}>The top 20 learners of RecallIQ.</p>
        </div>
        <Link href="/dashboard" className="btn btn-icon" style={{ borderRadius: "100px" }}>
          <ArrowUp style={{ transform: "rotate(-45deg)" }} />
        </Link>
      </div>

      {/* ── PODIUM ── */}
      {top3.length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "flex-end", 
          gap: "2rem", 
          marginBottom: "5rem", 
          padding: "2rem",
          background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.05) 0%, transparent 70%)"
        }}>
          {top3[1] && <PodiumItem user={top3[1]} rank={2} delay="0.1s" />}
          {top3[0] && <PodiumItem user={top3[0]} rank={1} delay="0s" />}
          {top3[2] && <PodiumItem user={top3[2]} rank={3} delay="0.2s" />}
        </div>
      )}

      {/* ── LIST ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "100px" }}>
        {remaining.map((user, index) => {
          const rank = index + 4;
          const isCurrentUser = user._id === convexUserId;
          return (
            <div 
              key={user._id} 
              className={`glass-card glass-card-hover ${isCurrentUser ? "aura-gold" : ""}`}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "1rem 1.5rem", 
                gap: "1.25rem",
                borderRadius: "20px",
                border: isCurrentUser ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.05)"
              }}
            >
              <div style={{ width: 40, fontWeight: 600, color: "var(--text-muted)", textAlign: "center" }}>#{rank}</div>
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>{user.displayName} {isCurrentUser && "⭐"}</p>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>
                  <span>{user.totalReviews} REVIEWS</span>
                  <span>•</span>
                  <span style={{ color: "var(--accent)" }}>{user.streak} DAY STREAK</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user.xp ?? 0}</p>
                <p style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", opacity: 0.5 }}>XP</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PINNED PROGRESS ── */}
      {currentUser && currentUserRank > 3 && (
        <div style={{ 
          position: "fixed", 
          bottom: "2rem", 
          left: "50%", 
          transform: "translateX(-50%)", 
          width: "calc(100% - 4rem)", 
          maxWidth: 900,
          zIndex: 50,
          animation: "slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <div className="glass-card aura-gold" style={{ 
            padding: "1.25rem 2rem", 
            borderRadius: "24px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            border: "1px solid var(--accent)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ background: "var(--accent)", color: "#000", width: 44, height: 44, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "1.1rem" }}>
                #{currentUserRank}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.01em" }}>YOUR GLOBAL RANKING</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>You're climbing the leaderboard! 🚀</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--accent)", lineHeight: 1 }}>{currentUser.xp ?? 0} <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>XP</span></p>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.5, marginTop: 4, letterSpacing: "0.05em" }}>KEEP PUSHING!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
