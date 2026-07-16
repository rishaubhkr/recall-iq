"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  CheckCircle, Calendar, Star, Loader2, BrainCircuit,
  TrendingUp, Zap, AlertTriangle, Activity, Shield,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";

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

/* ──────────────────────────── Shared Components ──────────────────────────── */

function ChartCard({ title, subtitle, children, loading, badge }: {
  title: string; subtitle?: string; children: React.ReactNode; loading?: boolean; badge?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid var(--border)",
      borderRadius: "20px",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {title}
          </h2>
          {subtitle && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.35rem", lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {badge && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              background: "rgba(245,158,11,0.1)", color: "var(--accent)", padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-pill)", border: "1px solid rgba(245,158,11,0.2)",
            }}>
              {badge}
            </span>
          )}
          {loading && <Loader2 size={16} className="text-muted animate-spin" />}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, value, label, color, subtitle }: {
  icon: typeof TrendingUp; value: string | number; label: string; color: string; subtitle?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
      borderRadius: "16px", padding: "1.5rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <Icon size={16} style={{ color, opacity: 0.7 }} />
      </div>
      <p style={{
        fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600,
        color, lineHeight: 1, letterSpacing: "-0.02em",
      }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────── Main Page ──────────────────────────── */

export default function AnalyticsPage() {
  const { convexUserId, streak, totalReviews, isLoading: userLoading } = useConvexUser();

  const stats = useQuery(
    api.analytics.getStudentStats,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const calibration = useQuery(
    api.analytics.getCalibrationData,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const timeline = useQuery(
    api.analytics.getMemoryGrowthTimeline,
    convexUserId ? { userId: convexUserId, days: 90 } : "skip",
  );

  const forgettingCurve = useQuery(
    api.analytics.getStudentForgettingCurve,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const isLoading = userLoading || stats === undefined || calibration === undefined;

  // Build 7-day retention series from dailyActivity map
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // eslint-disable-next-line react-hooks/purity
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const retentionData = last7Days.map((day) => ({
    day: day.slice(5),
    reviews: stats?.dailyActivity?.[day] ?? 0,
  }));

  const calibrationData = [...(calibration ?? [])].sort((a, b) => a.confidence - b.confidence);

  const noData = !isLoading && totalReviews === 0;

  return (
    <div className="animate-in" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", paddingBottom: "6rem" }}>
      
      {/* ─── Hero Section ─── */}
      <div style={{ padding: "4rem 0 3rem 0", borderBottom: "1px solid var(--border)", marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 700 }}>
          Your Progress
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--text-primary)" }}>
          <span style={{ color: "var(--accent)" }}>Analytics</span> Dashboard.
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontSize: "1.125rem", maxWidth: 600, lineHeight: 1.6 }}>
          Track your retention strength, calibration accuracy, and review consistency across all active batches.
        </p>
      </div>

      {noData ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>No data yet</p>
          <p style={{ fontSize: "0.875rem" }}>Complete your first study session to see analytics here.</p>
        </div>
      ) : (
        <>
          {/* ─── Overview Stats Row ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
            <InsightCard
              icon={CheckCircle} color="var(--success)"
              value={isLoading ? "…" : `${stats?.accuracy ?? 0}%`}
              label="This Week Accuracy"
              subtitle="Correct answers across all reviews"
            />
            <InsightCard
              icon={Star} color="var(--accent)"
              value={isLoading ? "…" : `${stats?.avgConfidence ?? 0}★`}
              label="Avg Confidence"
              subtitle="Self-rated confidence per card"
            />
            <InsightCard
              icon={Calendar} color="var(--info)"
              value={isLoading ? "…" : (stats?.dueToday ?? 0)}
              label="Due Today"
              subtitle="Cards waiting for review"
            />
          </div>

          {/* ─── Charts Section ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "2.5rem" }}>
            {/* Daily review activity */}
            <ChartCard
              title="Review Activity (7 Days)"
              subtitle="Total flashcards reviewed per day to build retention."
              loading={isLoading}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={retentionData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(v: any) => [v, "Reviews"]} />
                  <Bar dataKey="reviews" fill="url(#colorReviews)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Calibration chart */}
            {calibrationData.length > 0 && (
              <ChartCard
                title="Confidence Calibration"
                subtitle="Do you actually know what you think you know? A perfect student's bars follow a rising staircase."
                loading={isLoading}
              >
                <div style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem", background: "rgba(245, 158, 11, 0.05)", borderLeft: "3px solid var(--accent)", borderRadius: "0 8px 8px 0", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <BrainCircuit size={20} className="text-accent" />
                  <span><strong>Make It Stick:</strong> If 5-star confidence shows 60% accuracy, you are overconfident. Use this to study smarter.</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={calibrationData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--info)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--info)" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="confidence" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} dy={10}
                      label={{ value: "Confidence ★", position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" dx={-10} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(v: any, n: any) => [n === "accuracy" ? `${v}%` : v, n === "accuracy" ? "Accuracy" : "Reviews"]} />
                    <Bar dataKey="accuracy" fill="url(#colorAcc)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/*  NEW: Memory Growth & Forgetting Curve Section                     */}
          {/* ═══════════════════════════════════════════════════════════════════ */}

          {/* ─── Memory Half-Life Growth (Time-Series from Snapshots) ─── */}
          <MemoryGrowthChart timeline={timeline} />

          {/* ─── Personal Forgetting Curve ─── */}
          <ForgettingCurveChart data={forgettingCurve} />

          {/* ─── Session Insights Row ─── */}
          <SessionInsightsRow data={forgettingCurve} isLoading={forgettingCurve === undefined} />

          {/* ─── Subject Strength Breakdown ─── */}
          <SubjectStrengthSection timeline={timeline} />

          {/* ─── Adaptive Memory Profile (original) ─── */}
          <MemoryProfileSection convexUserId={convexUserId} />
        </>
      )}
    </div>
  );
}

/* ──────────────────────────── Memory Growth Chart ──────────────────────────── */

function MemoryGrowthChart({ timeline }: { timeline: any }) {
  const [range, setRange] = useState<30 | 60 | 90>(30);

  if (!timeline || timeline.length < 2) {
    return (
      <div style={{ marginBottom: "2.5rem" }}>
        <ChartCard
          title="Memory Half-Life Growth"
          subtitle="Your average memory stability over time — this is the metric that proves your brain is getting stronger."
        >
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "3rem 1rem", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "16px",
            background: "rgba(255,255,255,0.01)", textAlign: "center", gap: "1rem"
          }}>
            <BrainCircuit size={40} style={{ color: "var(--accent)", opacity: 0.6 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                Initializing Memory Tracking
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem", maxWidth: 420, lineHeight: 1.5 }}>
                Your memory half-life timeline is generated automatically every day at 3:00 AM UTC.
                Complete reviews today and your first data point will appear tomorrow!
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  }

  const filtered = timeline.filter((t: any) => {
    const cutoff = new Date(Date.now() - range * 86_400_000).toISOString().split("T")[0];
    return t.date >= cutoff;
  });

  const displayData = filtered.length >= 2 ? filtered : timeline;

  const firstStability = displayData[0].avgStability;
  const lastStability = displayData[displayData.length - 1].avgStability;
  const growthPct = firstStability > 0 ? Math.round(((lastStability - firstStability) / firstStability) * 100) : 0;

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <ChartCard
        title="Memory Half-Life Growth"
        subtitle="Your average memory stability over time — this is the metric that proves your brain is getting stronger."
        badge={`${growthPct >= 0 ? "+" : ""}${growthPct}% growth`}
      >
        {/* Range selector */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              style={{
                padding: "0.35rem 0.85rem", borderRadius: "var(--radius-pill)",
                border: range === d ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: range === d ? "rgba(245,158,11,0.1)" : "transparent",
                color: range === d ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {d}D
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={displayData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradStability" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradMedian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              axisLine={false} tickLine={false} dy={10}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              axisLine={false} tickLine={false} dx={-10}
              label={{ value: "days", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(l: string) => `Date: ${l}`}
              formatter={(v: any, name: string) => [
                `${v} days`,
                name === "avgStability" ? "Avg Stability" : "Median Stability",
              ]}
            />
            <Area
              type="monotone" dataKey="avgStability" name="avgStability"
              stroke="#10B981" strokeWidth={2.5} fill="url(#gradStability)"
              dot={false} activeDot={{ r: 4, fill: "#10B981", stroke: "#0F172A", strokeWidth: 2 }}
            />
            <Area
              type="monotone" dataKey="medianStability" name="medianStability"
              stroke="#6366F1" strokeWidth={1.5} fill="url(#gradMedian)"
              dot={false} strokeDasharray="4 4"
              activeDot={{ r: 3, fill: "#6366F1", stroke: "#0F172A", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", paddingLeft: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 12, height: 3, background: "#10B981", borderRadius: 2 }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Average Stability</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 12, height: 3, background: "#6366F1", borderRadius: 2, borderTop: "1px dashed #6366F1" }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Median Stability</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

/* ──────────────────────────── Forgetting Curve Chart ──────────────────────────── */

function ForgettingCurveChart({ data }: { data: any }) {
  if (!data || !data.hasData) return null;

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <ChartCard
        title="Your Personal Forgetting Curve"
        subtitle={`Average memory half-life: ${data.avgStability} days across ${data.totalCards} active cards.`}
        badge="FSRS v5"
      >
        <div style={{
          marginBottom: "1.5rem", padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.06))",
          borderLeft: "3px solid #10B981", borderRadius: "0 10px 10px 0",
          fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "0.75rem", alignItems: "center",
        }}>
          <Shield size={20} style={{ color: "#10B981", flexShrink: 0 }} />
          <span>The <strong style={{ color: "var(--text-primary)" }}>green area</strong> is memory saved by RecallIQ's spaced repetition. Without SRS, you'd forget 90% within a week.</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.curves} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="gradWithSRS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false} tickLine={false} dy={10}
            />
            <YAxis
              domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false} tickLine={false} unit="%" dx={-10}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any, name: string) => [
                `${v}%`,
                name === "withSRS" ? "With RecallIQ" : "Without SRS",
              ]}
            />
            <ReferenceLine y={90} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: "Target 90%", fill: "var(--text-muted)", fontSize: 10 }} />
            <Area
              type="monotone" dataKey="withSRS" name="withSRS"
              stroke="#10B981" strokeWidth={2.5} fill="url(#gradWithSRS)"
              dot={false}
              activeDot={{ r: 5, fill: "#10B981", stroke: "#0F172A", strokeWidth: 2 }}
            />
            <Area
              type="monotone" dataKey="withoutSRS" name="withoutSRS"
              stroke="#EF4444" strokeWidth={2} fill="url(#gradWithout)"
              dot={false} strokeDasharray="5 5"
              activeDot={{ r: 4, fill: "#EF4444", stroke: "#0F172A", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: "2rem", marginTop: "0.75rem", paddingLeft: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 14, height: 3, background: "#10B981", borderRadius: 2 }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>With RecallIQ</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 14, height: 3, background: "#EF4444", borderRadius: 2 }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Without SRS (Ebbinghaus)</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

/* ──────────────────────────── Session Insights Row ──────────────────────────── */

function SessionInsightsRow({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading || !data || !data.hasData) return null;

  const responseText = data.avgResponseMs > 0
    ? data.avgResponseMs < 3000 ? "Lightning fast" : data.avgResponseMs < 6000 ? "Good pace" : "Take your time"
    : "No data";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
      <InsightCard
        icon={Timer} color="#8B5CF6"
        value={data.avgResponseMs > 0 ? `${(data.avgResponseMs / 1000).toFixed(1)}s` : "—"}
        label="Avg Response Speed"
        subtitle={responseText}
      />
      <InsightCard
        icon={Activity} color="#10B981"
        value={`${data.calibrationAccuracy}%`}
        label="Calibration Accuracy"
        subtitle="How well you know what you know"
      />
      <InsightCard
        icon={AlertTriangle}
        color={data.leechCount > 3 ? "var(--error)" : "var(--accent)"}
        value={data.leechCount}
        label="Leech Cards"
        subtitle={data.leechCount > 0 ? "Cards with 5+ lapses — consider rewriting them" : "No problem cards detected"}
      />
    </div>
  );
}

/* ──────────────────────────── Subject Strength ──────────────────────────── */

function SubjectStrengthSection({ timeline }: { timeline: any }) {
  if (!timeline || timeline.length === 0) return null;

  // Get latest snapshot's subject breakdown
  const latest = timeline[timeline.length - 1];
  const subjects = latest?.subjectBreakdown;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return null;

  const sorted = [...subjects]
    .filter((s: any) => s.subjectName && s.subjectName !== "Other")
    .sort((a: any, b: any) => (b.avgStability ?? 0) - (a.avgStability ?? 0));

  if (sorted.length === 0) return null;

  const maxStability = Math.max(...sorted.map((s: any) => s.avgStability ?? 0), 1);

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <ChartCard
        title="Subject Strength"
        subtitle="Memory stability & accuracy per subject from your latest snapshot."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sorted.map((sub: any, i: number) => {
            const stabilityPct = Math.min(100, ((sub.avgStability ?? 0) / maxStability) * 100);
            const accuracy = Math.round((sub.accuracy ?? 0) * 100);
            const barColor = accuracy >= 85 ? "#10B981" : accuracy >= 70 ? "#F59E0B" : "#EF4444";

            return (
              <div key={sub.subjectName ?? i} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {sub.subjectName}
                  </span>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {(sub.avgStability ?? 0).toFixed(1)}d stability
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, color: barColor,
                      background: `${barColor}15`, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-pill)",
                    }}>
                      {accuracy}% acc
                    </span>
                  </div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${stabilityPct}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                    borderRadius: 10, transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

/* ──────────────────────────── Neural Memory Profile (Original) ──────────────────────────── */

function MemoryProfileSection({ convexUserId }: { convexUserId: any }) {
  const profiles = useQuery(
    api.analytics.getUserMemoryProfiles,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!profiles || profiles.length === 0) return null;

  const globalProfile = profiles.find((p: any) => p.subjectName === "Global Baseline");
  if (!globalProfile) return null;

  const getRetentionText = (mult: number) => {
    if (mult > 1.2) return "Exceptional long-term retention";
    if (mult > 1.05) return "Above average retention";
    if (mult > 0.95) return "Baseline retention";
    return "Fast-decaying memory (requires more frequent reps)";
  };

  const dataPoints = globalProfile.totalDataPoints;
  const isWarmingUp = dataPoints < 50;

  return (
    <div className="glass-card" style={{ marginTop: "0.5rem", padding: "2rem", borderRadius: "var(--radius-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BrainCircuit className="text-accent" /> Neural Memory Profile
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem", maxWidth: 600, lineHeight: 1.5 }}>
            RecallIQ doesn&apos;t use generic algorithms. We&apos;re actively modeling your unique forgetting curve.
            Every review you complete makes your schedule hyper-personalized.
          </p>
        </div>
        <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "0.5rem 1rem", borderRadius: "var(--radius-pill)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.05em" }}>
            {dataPoints} DATA POINTS
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.1em" }}>Retention Strength</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
              {globalProfile.retentionMultiplier.toFixed(2)}x
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--success)", fontWeight: 600, marginTop: "0.5rem" }}>
            {getRetentionText(globalProfile.retentionMultiplier)}
          </p>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "1rem" }}>System Calibration</p>
          <div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden", marginBottom: "0.75rem" }}>
              <div style={{ height: "100%", width: `${Math.min(100, globalProfile.profileConfidence * 100)}%`, background: "linear-gradient(90deg, var(--accent), #FCD34D)", borderRadius: 10, transition: "width 1s ease-out" }} />
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {isWarmingUp ? (
                <><strong>Warming up.</strong> The system is learning your forgetting curve. Accuracy improves dramatically after 50+ reviews.</>
              ) : (
                <><strong>Highly Calibrated.</strong> Your intervals are hyper-optimized for your specific brain chemistry.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
