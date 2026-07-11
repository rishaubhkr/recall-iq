"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Chart Spec Type ──────────────────────────────────────────────────────────

interface BaseSpec {
  title?: string;
  color?: string;
}

interface DataChartSpec extends BaseSpec {
  type: "bar" | "line";
  xKey: string;
  yKey: string;
  data: Record<string, unknown>[];
}

interface PieChartSpec extends BaseSpec {
  type: "pie";
  data: { name: string; value: number }[];
}

type ChartSpec = DataChartSpec | PieChartSpec;

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1",
];

const CHART_STYLE = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px",
  padding: "1.25rem",
  margin: "1.25rem 0",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#F1F5F9",
  fontSize: "0.82rem",
};

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function BarChartView({ spec }: { spec: DataChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={spec.data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey={spec.xKey} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey={spec.yKey} fill={spec.color ?? PALETTE[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ spec }: { spec: DataChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={spec.data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey={spec.xKey} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey={spec.yKey}
          stroke={spec.color ?? PALETTE[1]}
          strokeWidth={2.5}
          dot={{ r: 4, fill: spec.color ?? PALETTE[1], strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ spec }: { spec: PieChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={spec.data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {spec.data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: "#CBD5E1", fontSize: "0.8rem" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Error fallback ───────────────────────────────────────────────────────────

function ChartError({ raw, message }: { raw: string; message: string }) {
  return (
    <div style={{
      margin: "1.25rem 0",
      borderRadius: "12px",
      border: "1px dashed rgba(239, 68, 68, 0.4)",
      background: "rgba(239, 68, 68, 0.05)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "0.5rem 1rem",
        background: "rgba(239, 68, 68, 0.1)",
        borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "#EF4444",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        ⚠ Chart error: {message}
      </div>
      <pre style={{
        margin: 0, padding: "1rem", fontSize: "0.8rem",
        color: "#94A3B8", whiteSpace: "pre-wrap", wordBreak: "break-word",
        fontFamily: "var(--font-mono, monospace)",
      }}>
        {raw}
      </pre>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ChartBlockProps {
  raw: string; // The raw JSON string inside the ```chart fence
}

export function ChartBlock({ raw }: ChartBlockProps) {
  let spec: ChartSpec;
  try {
    spec = JSON.parse(raw.trim()) as ChartSpec;
  } catch {
    return <ChartError raw={raw} message="Invalid JSON" />;
  }

  if (!spec.type) return <ChartError raw={raw} message='Missing required "type" field' />;
  if (!["bar", "line", "pie"].includes(spec.type)) {
    return <ChartError raw={raw} message={`Unknown chart type: "${spec.type}"`} />;
  }
  if (!Array.isArray((spec as { data?: unknown }).data) || (spec.data as unknown[]).length === 0) {
    return <ChartError raw={raw} message='Missing or empty "data" array' />;
  }

  return (
    <div style={CHART_STYLE}>
      {spec.title && (
        <p style={{
          margin: "0 0 0.75rem",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          textAlign: "center",
        }}>
          {spec.title}
        </p>
      )}
      {spec.type === "bar" && <BarChartView spec={spec as DataChartSpec} />}
      {spec.type === "line" && <LineChartView spec={spec as DataChartSpec} />}
      {spec.type === "pie" && <PieChartView spec={spec as PieChartSpec} />}
    </div>
  );
}
