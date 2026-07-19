"use client";

import { useState, useEffect } from "react";

type LootTier = "bronze" | "silver" | "gold" | "diamond";

interface Reward {
  type: string;
  value: number;
  label: string;
}

interface Props {
  tier: LootTier;
  reward: Reward;
  onClaim: () => void;
}

const TIER_CONFIG: Record<LootTier, { color: string; glow: string; emoji: string; title: string }> = {
  bronze:  { color: "#CD7F32", glow: "rgba(205,127,50,0.4)",  emoji: "📦", title: "Bronze Chest" },
  silver:  { color: "#C0C0C0", glow: "rgba(192,192,192,0.4)", emoji: "🔒", title: "Silver Chest" },
  gold:    { color: "#FFD700", glow: "rgba(255,215,0,0.45)",  emoji: "🔑", title: "Gold Chest" },
  diamond: { color: "#818CF8", glow: "rgba(129,140,248,0.5)", emoji: "💎", title: "Diamond Chest" },
};

export function LootBoxReveal({ tier, reward, onClaim }: Props) {
  const [phase, setPhase] = useState<"shake" | "open" | "reward">("shake");
  const cfg = TIER_CONFIG[tier];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("open"), 1200);
    const t2 = setTimeout(() => setPhase("reward"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const rewardEmoji = reward.type === "shield" ? "🛡️" : "⚡";

  return (
    <>
      <style>{`
        @keyframes chest-shake {
          0%,100%{ transform: rotate(0deg) scale(1); }
          10%     { transform: rotate(-4deg) scale(1.05); }
          20%     { transform: rotate(4deg) scale(1.08); }
          30%     { transform: rotate(-4deg) scale(1.05); }
          40%     { transform: rotate(3deg) scale(1.06); }
          50%     { transform: rotate(-2deg) scale(1.04); }
          60%     { transform: rotate(2deg) scale(1.05); }
        }
        @keyframes chest-pop {
          0%  { transform: scale(1); }
          50% { transform: scale(1.3) rotate(-5deg); }
          100%{ transform: scale(0) rotate(10deg); opacity: 0; }
        }
        @keyframes reward-appear {
          0%  { opacity: 0; transform: translateY(40px) scale(0.6); }
          60% { transform: translateY(-10px) scale(1.1); }
          100%{ opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glow-pulse {
          0%,100%{ box-shadow: 0 0 40px var(--loot-glow); }
          50%    { box-shadow: 0 0 80px var(--loot-glow), 0 0 120px var(--loot-glow); }
        }
        @keyframes particle-burst {
          0%  { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
          100%{ opacity: 0; transform: translateY(var(--py)) translateX(var(--px)) scale(0); }
        }
        .loot-particle { position: absolute; border-radius: 50%; animation: particle-burst 0.9s ease-out forwards; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          textAlign: "center", padding: "3rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem",
          position: "relative",
        }}>
          {/* Title */}
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
              Session Reward Unlocked!
            </p>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>{cfg.title}</h2>
          </div>

          {/* Chest / Reward */}
          <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>

            {/* Glow ring */}
            <div style={{
              position: "absolute", inset: -20,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
              animation: phase !== "reward" ? "glow-pulse 0.8s ease infinite" : "none",
            }} />

            {/* Chest */}
            {phase !== "reward" && (
              <div style={{
                fontSize: "8rem", lineHeight: 1,
                animation: phase === "shake" ? "chest-shake 1s ease infinite" : "chest-pop 0.5s ease forwards",
                filter: `drop-shadow(0 0 20px ${cfg.color})`,
                cursor: "default",
              }}>
                📦
              </div>
            )}

            {/* Particles on open */}
            {phase === "open" && Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * 360;
              const dist = 60 + Math.random() * 40;
              const px = `${Math.cos((angle * Math.PI) / 180) * dist}px`;
              const py = `${Math.sin((angle * Math.PI) / 180) * dist}px`;
              return (
                <div key={i} className="loot-particle" style={{
                  width: 10, height: 10,
                  background: i % 2 === 0 ? cfg.color : "#fff",
                  top: "50%", left: "50%",
                  ["--px" as any]: px, ["--py" as any]: py,
                  animationDelay: `${i * 0.06}s`,
                }} />
              );
            })}

            {/* Reward reveal */}
            {phase === "reward" && (
              <div style={{
                animation: "reward-appear 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
              }}>
                <div style={{ fontSize: "6rem", lineHeight: 1, filter: `drop-shadow(0 0 24px ${cfg.color})` }}>
                  {rewardEmoji}
                </div>
                <div style={{
                  background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                  border: `2px solid ${cfg.color}60`,
                  borderRadius: 100, padding: "0.6rem 1.75rem",
                  fontSize: "1.25rem", fontWeight: 800, color: cfg.color,
                }}>
                  {reward.label}
                </div>
              </div>
            )}
          </div>

          {/* Claim button */}
          {phase === "reward" && (
            <button
              onClick={onClaim}
              style={{
                background: cfg.color, color: "#000",
                border: "none", borderRadius: 14,
                padding: "1rem 3rem", fontSize: "1.1rem", fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 8px 24px ${cfg.glow}`,
                animation: "reward-appear 0.5s 0.3s both",
              }}
            >
              Claim Reward ✨
            </button>
          )}

          {/* Skip (visible during shake phase only) */}
          {phase === "shake" && (
            <button onClick={onClaim} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "0.85rem" }}>
              Skip
            </button>
          )}
        </div>
      </div>
    </>
  );
}
