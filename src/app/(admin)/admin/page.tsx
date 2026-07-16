"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  BookOpen, Users, BarChart3, Star, Loader2, Zap, Upload, Library,
  HelpCircle, ArrowRight, BrainCircuit, TrendingDown, Activity,
  AlertTriangle, Layers,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  fontSize: "0.8rem",
  boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.6)",
  padding: "0.75rem 1rem",
};

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
  const advancedStats = useQuery(api.analytics.getAdminAdvancedStats);
  const isLoading = adminStats === undefined;
  const advLoading = advancedStats === undefined;

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
    <div style={{ maxWidth: 1060, width: "100%", margin: "0 auto" }}>
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  NEW: Platform Memory Health Section                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <PlatformMemoryHealth data={advancedStats} loading={advLoading} />

      {/* Charts Grid: Retention Funnel + Lapse Rate */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <RetentionFunnel data={advancedStats} loading={advLoading} totalUsers={adminStats?.totalUsers ?? 0} />
        <LapseRateTrend data={advancedStats} loading={advLoading} />
      </div>

      {/* Hardest Subjects */}
      <HardestSubjects data={advancedStats} loading={advLoading} />

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
      <div className="card" style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "1rem" }}>
          Most Failed Cards
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>Top 5 by &quot;Again&quot; ratings</span>
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

/* ──────────────────────────── Platform Memory Health Hero ──────────────────────────── */

function PlatformMemoryHealth({ data, loading }: { data: any; loading: boolean }) {
  if (loading || !data) {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))",
        border: "1px solid var(--border)", borderRadius: "20px",
        padding: "2rem", marginBottom: "2.5rem",
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120,
      }}>
        <Loader2 size={20} className="text-muted animate-spin" />
      </div>
    );
  }

  const halfLife = data.avgHalfLife;
  const coverage = data.snapshotCoverage;
  const trend = data.weeklyHalfLife;
  const hasTrend = trend && trend.length > 1 && trend.some((t: any) => t.halfLife > 0);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))",
      border: "1px solid rgba(16,185,129,0.15)", borderRadius: "20px",
      padding: "2rem", marginBottom: "2.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <BrainCircuit size={22} style={{ color: "#10B981" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Platform Memory Health
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            The single metric that proves your platform works. Higher = students remember longer.
          </p>
        </div>
        <div style={{
          background: "rgba(16,185,129,0.1)", padding: "0.4rem 0.85rem",
          borderRadius: "var(--radius-pill)", border: "1px solid rgba(16,185,129,0.2)",
        }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10B981", letterSpacing: "0.05em" }}>
            {coverage} USERS TRACKED
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: hasTrend ? "280px 1fr" : "1fr", gap: "2rem", alignItems: "center" }}>
        {/* Hero number */}
        <div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            Avg Memory Half-Life
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "4rem", fontWeight: 600,
              color: "#10B981", lineHeight: 1, letterSpacing: "-0.03em",
            }}>
              {halfLife > 0 ? halfLife.toFixed(1) : "—"}
            </span>
            <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 500 }}>days</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            {halfLife > 30 ? "Excellent — students retain knowledge for over a month"
              : halfLife > 14 ? "Good — two-week retention baseline established"
              : halfLife > 0 ? "Early stage — retention will grow as students review more"
              : "No snapshot data yet — runs daily via cron"}
          </p>
        </div>

        {/* Sparkline trend */}
        {hasTrend && (
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="week" hide />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any) => [`${v} days`, "Half-Life"]}
                />
                <Line
                  type="monotone" dataKey="halfLife"
                  stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: "#10B981", stroke: "#0F172A", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── Retention Funnel ──────────────────────────── */

function RetentionFunnel({ data, loading, totalUsers }: { data: any; loading: boolean; totalUsers: number }) {
  if (loading || !data) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2rem", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={18} className="text-muted animate-spin" />
      </div>
    );
  }

  const funnel = data.retentionFunnel;
  const funnelData = [
    { stage: "Total", count: funnel.total, color: "#6366F1" },
    { stage: "90d", count: funnel.active90d, color: "#8B5CF6" },
    { stage: "30d", count: funnel.active30d, color: "#F59E0B" },
    { stage: "7d", count: funnel.active7d, color: "#10B981" },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
      borderRadius: "20px", padding: "2rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <Layers size={18} style={{ color: "#6366F1" }} />
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
          User Retention Funnel
        </h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {funnelData.map((item) => {
          const pct = funnel.total > 0 ? Math.round((item.count / funnel.total) * 100) : 0;
          return (
            <div key={item.stage}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  {item.stage === "Total" ? "Registered" : `Active ${item.stage}`}
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: item.color }}>
                  {item.count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                  borderRadius: 10, transition: "width 0.8s ease-out",
                  minWidth: pct > 0 ? "4px" : 0,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────── Lapse Rate Trend ──────────────────────────── */

function LapseRateTrend({ data, loading }: { data: any; loading: boolean }) {
  if (loading || !data) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2rem", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={18} className="text-muted animate-spin" />
      </div>
    );
  }

  const lapseData = data.weeklyLapseRates;
  const hasData = lapseData && lapseData.some((d: any) => d.rate > 0);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
      borderRadius: "20px", padding: "2rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <TrendingDown size={18} style={{ color: "#EF4444" }} />
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Lapse Rate Trend
        </h3>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
        Platform-wide forgetting rate. Declining = algorithm improving.
      </p>
      {hasData ? (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={lapseData} barSize={28} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradLapse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, "Lapse Rate"]} />
            <Bar dataKey="rate" fill="url(#gradLapse)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No snapshot data yet. Lapse rate tracking begins once students have review history.
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Hardest Subjects ──────────────────────────── */

function HardestSubjects({ data, loading }: { data: any; loading: boolean }) {
  if (loading || !data || !data.hardestSubjects || data.hardestSubjects.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
      borderRadius: "20px", padding: "2rem", marginBottom: "2.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <AlertTriangle size={18} style={{ color: "#F59E0B" }} />
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Hardest Subjects
        </h3>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Subjects with the highest difficulty scores across the platform. These may need better cards or more scaffolding.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {data.hardestSubjects.map((sub: any, i: number) => {
          const barColor = sub.difficultyScore > 30 ? "#EF4444" : sub.difficultyScore > 15 ? "#F59E0B" : "#10B981";
          return (
            <div key={sub.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", width: 18 }}>#{i + 1}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{sub.name}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{sub.studentCount} students</span>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700, color: barColor,
                    background: `${barColor}15`, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-pill)",
                  }}>
                    {sub.difficultyScore}% difficulty
                  </span>
                </div>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${Math.min(100, sub.difficultyScore)}%`,
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                  borderRadius: 10, transition: "width 0.8s ease-out",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
