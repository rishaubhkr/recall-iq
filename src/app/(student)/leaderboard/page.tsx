"use client";

import { useState, Suspense, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Loader2, Trophy, Medal, Crown, Flame, ArrowUp, TrendingUp, TrendingDown, Clock } from "lucide-react";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"weekly" | "global">("weekly");
  const [timeLeft, setTimeLeft] = useState("");

  const globalLeaderboard = useQuery(api.users.getLeaderboard);
  const leagueLeaderboard = useQuery(
    api.leagues.getLeagueLeaderboard,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Time remaining until Sunday 23:59 UTC
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()) % 7);
      nextSunday.setUTCHours(23, 59, 0, 0);
      
      if (nextSunday.getTime() <= now.getTime()) {
        nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
      }

      const diff = nextSunday.getTime() - now.getTime();
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);

      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const LEAGUE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    Bronze:   { color: "#CD7F32", bg: "rgba(205,127,50,0.15)", border: "rgba(205,127,50,0.4)" },
    Silver:   { color: "#E0E0E0", bg: "rgba(224,224,224,0.15)", border: "rgba(224,224,224,0.4)" },
    Gold:     { color: "#FFD700", bg: "rgba(255,215,0,0.15)", border: "rgba(255,215,0,0.4)" },
    Platinum: { color: "#30D5C8", bg: "rgba(48,213,200,0.15)", border: "rgba(48,213,200,0.4)" },
    Diamond:  { color: "#B9F2FF", bg: "rgba(185,242,255,0.15)", border: "rgba(185,242,255,0.4)" },
  };

  const activeLeaderboard = activeTab === "weekly" ? (leagueLeaderboard ?? []) : (globalLeaderboard ?? []);

  if (globalLeaderboard === undefined || (activeTab === "weekly" && leagueLeaderboard === undefined)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const userLeague = leagueLeaderboard?.[0]?.league ?? "Bronze";
  const colors = LEAGUE_COLORS[userLeague] ?? LEAGUE_COLORS.Bronze;

  const top3 = activeLeaderboard.slice(0, 3);
  const remaining = activeLeaderboard.slice(3);
  const currentUser = activeLeaderboard.find(u => u._id === convexUserId);
  const currentUserRank = activeLeaderboard.findIndex(u => u._id === convexUserId) + 1;

  // Weekly League helper stats
  const totalCompetitors = activeLeaderboard.length;
  const promoteCutoff = Math.max(1, Math.ceil(totalCompetitors * 0.25));
  const relegateCutoff = Math.max(1, Math.ceil(totalCompetitors * 0.2));

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", background: "var(--bg-primary)", minHeight: "100vh" }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 600, letterSpacing: "-0.04em", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            Leaderboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: 500 }}>
            {activeTab === "weekly" ? `Compete weekly with peers in the ${userLeague} League.` : "All-time highest XP earners of RecallIQ."}
          </p>
        </div>
        <Link href="/dashboard" style={{
          textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.08)",
          width: 44, height: 44, borderRadius: "50%", color: "var(--text-primary)", fontSize: "1.2rem"
        }}>
          ‹
        </Link>
      </div>

      {/* ── TABS & CONTROLS ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
        {/* Tab switch buttons */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px", borderRadius: "100px" }}>
          <button
            onClick={() => setActiveTab("weekly")}
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 700, border: "none", cursor: "pointer",
              background: activeTab === "weekly" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "weekly" ? "var(--accent)" : "rgba(255,255,255,0.5)",
              transition: "all 0.2s ease"
            }}
          >
            Weekly League
          </button>
          <button
            onClick={() => setActiveTab("global")}
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 700, border: "none", cursor: "pointer",
              background: activeTab === "global" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "global" ? "var(--accent)" : "rgba(255,255,255,0.5)",
              transition: "all 0.2s ease"
            }}
          >
            Global Elite
          </button>
        </div>

        {/* Weekly League Status Badge */}
        {activeTab === "weekly" && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700,
              background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color
            }}>
              🏆 {userLeague} League
            </span>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
              <Clock size={13} /> Ends in {timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* ── PODIUM ── */}
      {top3.length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "flex-end", 
          gap: "2rem", 
          marginBottom: "4rem", 
          padding: "2rem",
          background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.03) 0%, transparent 70%)"
        }}>
          {top3[1] && <PodiumItem user={top3[1]} rank={2} delay="0.1s" />}
          {top3[0] && <PodiumItem user={top3[0]} rank={1} delay="0s" />}
          {top3[2] && <PodiumItem user={top3[2]} rank={3} delay="0.2s" />}
        </div>
      )}

      {/* ── LEADERBOARD LIST ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "120px" }}>
        {remaining.map((user, index) => {
          const rank = index + 4;
          const isCurrentUser = user._id === convexUserId;
          
          // Determine status text for weekly league
          let statusColor = "rgba(255,255,255,0.3)";
          let statusText = "";
          let icon = null;

          if (activeTab === "weekly") {
            if (rank <= promoteCutoff && userLeague !== "Diamond") {
              statusColor = "#10B981"; // Emerald
              statusText = "Promoting";
              icon = <TrendingUp size={12} />;
            } else if (rank > totalCompetitors - relegateCutoff && userLeague !== "Bronze") {
              statusColor = "#EF4444"; // Red
              statusText = "Relegation Zone";
              icon = <TrendingDown size={12} />;
            } else {
              statusText = "Safe Zone";
            }
          }

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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginTop: "0.15rem" }}>
                  <span>{user.weeklyXp !== undefined ? `${user.weeklyXp} XP` : `${user.totalReviews} REVIEWS`}</span>
                  <span>•</span>
                  <span style={{ color: "var(--accent)" }}>{user.streak} DAY STREAK</span>
                  {statusText && (
                    <>
                      <span>•</span>
                      <span style={{ color: statusColor, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        {icon} {statusText}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user.weeklyXp !== undefined ? user.weeklyXp : (user.xp ?? 0)}</p>
                <p style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", opacity: 0.5 }}>XP</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PINNED CURRENT USER FOOTER ── */}
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
                <p style={{ fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.01em" }}>YOUR {activeTab === "weekly" ? "WEEKLY" : "GLOBAL"} RANKING</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  {activeTab === "weekly" 
                    ? (currentUserRank <= promoteCutoff && userLeague !== "Diamond" ? "You are currently in the promotion zone! 🌟" : "Keep earning XP to rank up!")
                    : "You're climbing the global board! 🚀"
                  }
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--accent)", lineHeight: 1 }}>
                {activeTab === "weekly" ? (currentUser.weeklyXp ?? 0) : (currentUser.xp ?? 0)} <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>XP</span>
              </p>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.5, marginTop: 4, letterSpacing: "0.05em" }}>KEEP PUSHING!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
