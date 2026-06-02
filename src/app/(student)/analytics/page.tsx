"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CheckCircle, Calendar, Star, Loader2, BrainCircuit } from "lucide-react";
import { useMemo } from "react";

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900 with opacity
  backdropFilter: "blur(8px)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
};

function ChartCard({ title, subtitle, children, loading }: {
  title: string; subtitle?: string; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.25rem", color: "var(--text-primary)" }}>{title}</h2>
          {subtitle && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{subtitle}</p>}
        </div>
        {loading && <Loader2 size={18} className="text-muted animate-spin" />}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

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
    <div className="animate-in" style={{ maxWidth: 1000, width: "100%", margin: "0 auto", paddingBottom: "6rem" }}>
      
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
          {/* Overview stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "3rem" }}>
            {[
              { value: isLoading ? "…" : `${stats?.accuracy ?? 0}%`, label: "This Week Accuracy", color: "var(--success)", icon: CheckCircle },
              { value: isLoading ? "…" : `${stats?.avgConfidence ?? 0}`,  label: "Avg Confidence",  color: "var(--accent)", icon: Star },
              { value: isLoading ? "…" : (stats?.dueToday ?? 0),           label: "Due Today",       color: "var(--info)", icon: Calendar },
            ].map(({ value, label, color, icon: Icon }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</p>
                  <Icon size={18} style={{ color, opacity: 0.8 }} />
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color, lineHeight: 1 }}>
                  {value}
                  {label === "Avg Confidence" && !isLoading && <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", marginLeft: "0.2rem" }}>★</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "3rem" }}>
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
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(v) => [v, "Reviews"]} />
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
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(v, n) => [n === "accuracy" ? `${v}%` : v, n === "accuracy" ? "Accuracy" : "Reviews"]} />
                    <Bar dataKey="accuracy" fill="url(#colorAcc)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Adaptive Memory Profile */}
          <MemoryProfileSection convexUserId={convexUserId} />
        </>
      )}
    </div>
  );
}

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
    <div className="glass-card" style={{ marginTop: "2rem", padding: "2rem", borderRadius: "var(--radius-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BrainCircuit className="text-accent" /> Neural Memory Profile
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem", maxWidth: 600, lineHeight: 1.5 }}>
            RecallIQ doesn't use generic algorithms. We're actively modeling your unique forgetting curve.
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
