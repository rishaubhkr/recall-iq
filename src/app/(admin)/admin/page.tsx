"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BookOpen, Users, BarChart3, Star, Loader2, Zap, Upload, Library, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function StatCard({ icon: Icon, value, label, color, description }: {
  icon: typeof BookOpen; value: string | number; label: string; color: string; description: string;
}) {
  return (
    <div className="card" style={{ 
      display: "flex", alignItems: "center", gap: "1.25rem", height: "100%", 
      background: "var(--bg-elevated)", 
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "20px",
      padding: "1.25rem 1.5rem",
      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)"
    }}>
      <div style={{
        width: 44, height: 44, background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "12px", flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: "1.75rem", fontWeight: 600, fontFamily: "var(--font-display)", lineHeight: 1, color }}>{value}</p>
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

export default function AdminDashboardPage() {
  const adminStats = useQuery(api.analytics.getAdminStats);
  const isLoading = adminStats === undefined;

  const convRate = adminStats
    ? adminStats.totalUsers > 0
      ? `${Math.round((adminStats.premiumUsers / adminStats.totalUsers) * 100)}%`
      : "0%"
    : "…";

  const stats = [
    { 
      icon: Users, value: isLoading ? "…" : adminStats!.totalUsers, label: "Total Users", color: "var(--info)",
      description: "Total registered students on the platform." 
    },
    { 
      icon: BookOpen, value: isLoading ? "…" : adminStats!.publishedCards, label: "Published Cards", color: "var(--accent)",
      description: "Total flashcards currently active and studyable."
    },
    { 
      icon: BarChart3, value: isLoading ? "…" : adminStats!.dau, label: "Active (24h)", color: "var(--success)",
      description: "Daily Active Users who performed at least one review."
    },
    { 
      icon: Star, value: isLoading ? "…" : convRate, label: "Premium Rate", color: "var(--chemistry)",
      description: "Percentage of users with a premium subscription."
    },
  ];

  return (
    <div style={{ maxWidth: 960, width: "100%", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }} className="animate-in">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Admin
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
          Platform Overview
        </h1>
      </div>

      <style>{`
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
        
        .action-card {
          flex: 1; min-width: 200px; padding: 1.5rem; background: var(--bg-elevated);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s;
          text-decoration: none;
        }
        .action-card:hover { border-color: var(--accent); transform: translateY(-4px); background: rgba(255,255,255,0.04); }
      `}</style>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick Actions Bento */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: "1.25rem", fontSize: "1.1rem", display: "flex", alignItems: "center", color: "var(--text-primary)" }}>
          Quick Actions
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          <Link href="/admin/cards/new" className="action-card">
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color="var(--accent)" fill="var(--accent)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                Create Cards <ArrowRight size={14} className="text-muted" />
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Add new flashcards or MCQs to any course.</p>
            </div>
          </Link>

          <Link href="/admin/courses" className="action-card">
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Library size={20} color="var(--info)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                Manage Courses <ArrowRight size={14} className="text-muted" />
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Organize subjects, and topics within courses.</p>
            </div>
          </Link>

          <Link href="/admin/import" className="action-card">
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={20} color="var(--success)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                Bulk Import <ArrowRight size={14} className="text-muted" />
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Import cards via JSON or CSV files.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Most failed cards */}
      <div className="card">
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "1rem" }}>
          Most Failed Cards
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>Top 5 by "Again" ratings</span>
        </p>

        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", padding: "1rem" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.875rem" }}>Loading…</span>
          </div>
        )}

        {!isLoading && adminStats!.topFailed.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem" }}>
            No failed cards yet — data appears after students start reviewing.
          </p>
        )}

        {!isLoading && adminStats!.topFailed.map((item, i) => (
          <div key={item.cardId} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 0", borderBottom: i < adminStats!.topFailed.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", width: 20 }}>#{i + 1}</span>
              <span style={{ fontSize: "0.82rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {item.cardId.slice(-8)}…
              </span>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--error)", fontWeight: 600 }}>{item.count}× Again</span>
          </div>
        ))}
      </div>
    </div>
  );
}
