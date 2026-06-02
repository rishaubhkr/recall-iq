import type { Metadata } from "next";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Upgrade to Premium | RecallIQ",
  description: "Unlock all 620+ JEE cards, interleaved sessions, full analytics, and calibration insights.",
};

const FREE_FEATURES = [
  "60 Physics + 45 Chemistry + 50 Maths cards",
  "Spaced repetition (FSRS v5)",
  "Retrieval Practice flashcards",
  "Basic 7-day activity tracker",
];

const PREMIUM_FEATURES = [
  "All 620+ cards (JEE Mains + Advanced)",
  "MCQ, Cloze, and Elaborative card types",
  "Interleaved multi-subject sessions",
  "Full calibration analytics chart",
  "Retention curve and per-subject breakdown",
  "Offline PWA — study without internet",
  "Priority content updates (new chapters weekly)",
];

export default function UpgradePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "2rem", display: "inline-block" }}>
          ← Back to Dashboard
        </Link>

        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700, marginBottom: "0.75rem" }}>
            Freemium → Premium
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Unlock the Full Science
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.75rem", fontSize: "1rem" }}>
            All 6 Make It Stick techniques. All subjects. No card limits.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Free tier */}
          <div className="card" style={{ opacity: 0.7 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>Free</p>
            <p style={{ fontSize: "2.5rem", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
              ₹0<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {FREE_FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Check size={15} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Current Plan</p>
          </div>

          {/* Premium tier */}
          <div className="card" style={{ borderColor: "var(--border-accent)", background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(245,158,11,0.05) 100%)", position: "relative" }}>
            {/* Badge */}
            <div style={{ position: "absolute", top: "-0.75rem", right: "1.25rem", background: "var(--accent)", color: "#0F1117", fontSize: "0.65rem", fontWeight: 600, padding: "0.25rem 0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              BEST VALUE
            </div>

            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--accent)" }}>Premium</p>
            <p style={{ fontSize: "2.5rem", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "1.5rem", color: "var(--accent)" }}>
              ₹149<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", fontSize: "0.85rem" }}>
                  <Check size={15} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            <button className="btn btn-primary pulse-accent" style={{ width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "1rem" }}>
              <Zap size={18} /> Upgrade Now
            </button>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
              Cancel anytime · No commitment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
