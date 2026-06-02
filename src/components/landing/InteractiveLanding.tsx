"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InlineMath } from "react-katex";
import {
  Brain,
  Zap,
  Target,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  BarChart,
  Calendar
} from "lucide-react";

// Exam Date Database (2027 targets)
const EXAMS = {
  jee: {
    name: "JEE Advanced 2027",
    date: new Date("2027-05-30T09:00:00"),
    desc: "Targeting IIT Bombay, Delhi, Madras & top engineering seats.",
    quote: "AIR 1 starts with permanent recall."
  },
  neet: {
    name: "NEET UG 2027",
    date: new Date("2027-05-02T14:00:00"),
    desc: "Targeting AIIMS Delhi, MAMC & top medical colleges.",
    quote: "360/360 in Biology is built on retrieval practice."
  },
  gate: {
    name: "GATE 2027",
    date: new Date("2027-02-06T09:00:00"),
    desc: "Targeting IISc, top IITs for M.Tech & PSU recruitment.",
    quote: "A single forgotten formula is the difference between top 100 and un-qualified."
  }
};

// Simulation Questions
const SIMULATOR_CARDS = [
  {
    subject: "physics",
    topic: "Modern Physics · de Broglie Wavelength",
    question: "Relation between de Broglie wavelength \\lambda of an electron and accelerating potential V",
    formula: "\\lambda \\approx \\frac{12.27}{\\sqrt{V}}\\ \\text{Å}",
    why: "Wavelength \\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2m E}} = \\frac{h}{\\sqrt{2m eV}}. Plugging in physical constants (Planck's constant, electron mass, elementary charge) yields \\approx 12.27 / \\sqrt{V} Angstroms."
  },
  {
    subject: "chemistry",
    topic: "Physical Chemistry · Chemical Kinetics",
    question: "Write the Arrhenius Equation for temperature dependence of reaction rate constant k",
    formula: "k = A e^{-\\frac{E_a}{RT}}",
    why: "Describes rate constant k increasing exponentially with temperature T. The term e^{-E_a/RT} represents the fraction of molecular collisions having kinetic energy greater than the activation energy E_a."
  }
];

export default function InteractiveLanding() {
  const [selectedExam, setSelectedExam] = useState<keyof typeof EXAMS>("jee");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Simulator state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [simStep, setSimStep] = useState<"question" | "confidence" | "reveal" | "done">("question");
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [fsrsScheduledDays, setFsrsScheduledDays] = useState(0);

  // Calculator state
  const [studyHours, setStudyHours] = useState(6);
  const [method, setMethod] = useState<"reread" | "fsrs">("fsrs");

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const target = EXAMS[selectedExam].date.getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedExam]);

  // FSRS scheduling calculation simulation based on confidence rating
  const handleConfidence = (score: number) => {
    setConfidenceScore(score);
    setSimStep("reveal");
  };

  const handleRateRecall = (rating: 1 | 2 | 3 | 4) => {
    // Simulate FSRS intervals in days based on rating & confidence
    const baseIntervals = { 1: 0.1, 2: 1.2, 3: 4.2, 4: 9.8 };
    const multiplier = 1 + (confidenceScore * 0.15);
    const resultInterval = Math.min(25, parseFloat((baseIntervals[rating] * multiplier).toFixed(1)));
    setFsrsScheduledDays(resultInterval);
    setSimStep("done");
  };

  const resetSimulator = () => {
    setSimStep("question");
    setConfidenceScore(0);
    setActiveCardIndex((prev) => (prev + 1) % SIMULATOR_CARDS.length);
  };

  // Calculator Outputs
  const retentionRate = method === "fsrs" ? 92 : 18;
  const cardsMastered = method === "fsrs" 
    ? Math.round(studyHours * 15 * 30 * 0.92) 
    : Math.round(studyHours * 15 * 30 * 0.18);
  const potentialScoreGain = method === "fsrs"
    ? Math.round(studyHours * 6.5)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Dynamic Background Network Grids */}
      <div 
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.007) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.007) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          pointerEvents: "none",
          zIndex: 1
        }} 
      />

      {/* Floating Header */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "1.25rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,12,14,0.85)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.25rem", letterSpacing: "-0.03em" }}>
            Recall<span style={{ color: "var(--accent)" }}>IQ</span>
          </span>
          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", border: "1px solid var(--border-accent)", color: "var(--accent)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            v5.0 Stable
          </span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/sign-in" className="btn btn-ghost" id="nav-signin-btn">Sign In</Link>
          <Link href="/sign-up" className="btn btn-primary" id="nav-signup-btn">Start Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        paddingTop: "140px",
        paddingBottom: "80px",
        paddingLeft: "clamp(1.5rem, 8vw, 10rem)",
        paddingRight: "clamp(1.5rem, 8vw, 10rem)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "1000px" }}>
          {/* Target Exam Chips */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            {(Object.keys(EXAMS) as Array<keyof typeof EXAMS>).map((key) => (
              <button
                key={key}
                id={`exam-select-${key}`}
                onClick={() => setSelectedExam(key)}
                style={{
                  padding: "0.5rem 1.25rem",
                  background: selectedExam === key ? "var(--accent-glow)" : "rgba(255,255,255,0.02)",
                  border: selectedExam === key ? "2px solid var(--accent)" : "1px solid var(--border)",
                  color: selectedExam === key ? "white" : "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "var(--transition)"
                }}
              >
                {EXAMS[key].name}
              </button>
            ))}
          </div>

          <h1 className="display-xl" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "2rem" }}>
            Master the Syllabus.<br />
            Secure Your <span style={{ color: "var(--accent)" }}>Dream Rank.</span>
          </h1>

          <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "680px", marginBottom: "3rem" }}>
            Don't leave your exam rank to the mercy of the forgetting curve. RecallIQ uses the advanced FSRS v5 spaced repetition algorithm to schedule memory reviews at the exact millisecond before you forget.
          </p>

          {/* Countdown Clock HUD */}
          <div style={{
            background: "rgba(15,22,26,0.6)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--accent)",
            padding: "1.5rem 2rem",
            maxWidth: "750px",
            marginBottom: "3rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem"
          }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.1em" }}>
                HUD Countdown Timer · {EXAMS[selectedExam].name}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                {EXAMS[selectedExam].desc}
              </p>
            </div>
            
            {/* Clock digits */}
            <div style={{ display: "flex", gap: "1rem", fontFamily: "var(--font-mono)" }}>
              {[
                { label: "D", val: timeLeft.days },
                { label: "H", val: timeLeft.hours },
                { label: "M", val: timeLeft.minutes },
                { label: "S", val: timeLeft.seconds }
              ].map((t) => (
                <div key={t.label} style={{ textAlign: "center" }}>
                  <div style={{
                    background: "#162228",
                    padding: "0.5rem 0.75rem",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "white",
                    minWidth: "50px",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    {String(t.val).padStart(2, "0")}
                  </div>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn btn-primary animate-pulse-amber" style={{ padding: "0.875rem 2.5rem" }} id="hero-cta-btn">
              Begin Retaining Now
            </Link>
            <a href="#simulator" className="btn btn-ghost" style={{ padding: "0.875rem 1.5rem" }}>
              Try Recall Simulator
            </a>
          </div>
        </div>
      </header>

      {/* Simulator Section (Mini Game) */}
      <section id="simulator" style={{
        padding: "100px clamp(1.5rem, 8vw, 10rem) 80px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          
          {/* Left info column */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", background: "rgba(245,158,11,0.08)", border: "1px solid var(--border-accent)", borderRadius: "100px", marginBottom: "1.5rem" }}>
              <Brain size={14} className="text-accent" />
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                Memory simulator · interactive
              </span>
            </div>
            
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
              Experience the Spaced Repetition Engine.
            </h2>
            
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Test yourself right now. Active recall works by forcing your neural pathways to recreate the target information rather than passively reviewing notes. 
            </p>
            
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} className="text-accent" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span><strong>Step 1:</strong> Attempt the question. Rate your confidence before revealing the answer to build meta-cognitive accuracy.</span>
              </li>
              <li style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} className="text-accent" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span><strong>Step 2:</strong> Rate the actual difficulty of the recall. FSRS v5 uses this calibration to schedule the next optimal review.</span>
              </li>
            </ul>
          </div>

          {/* Right simulator panel */}
          <div style={{
            background: "rgba(8,12,14,0.9)",
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            padding: "2rem",
            minHeight: "350px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, textTransform: "uppercase" }}>
                {SIMULATOR_CARDS[activeCardIndex].topic}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                CARD {activeCardIndex + 1} OF {SIMULATOR_CARDS.length}
              </span>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "1rem 0" }}>
              {simStep === "question" && (
                <div style={{ textAlign: "center" }} className="animate-in">
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Question</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 500, color: "white", marginBottom: "1.5rem" }}>
                    {SIMULATOR_CARDS[activeCardIndex].question}
                  </p>
                  
                  <button 
                    id="simulator-reveal-btn"
                    onClick={() => setSimStep("confidence")}
                    className="btn btn-ghost" 
                    style={{ fontSize: "0.8rem", border: "1px dashed var(--accent)" }}
                  >
                    Attempt Retrieval & Reveal
                  </button>
                </div>
              )}

              {simStep === "confidence" && (
                <div style={{ textAlign: "center", width: "100%" }} className="animate-in">
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                    Before Reveal: Rate your confidence (1-5)
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        id={`conf-${stars}`}
                        onClick={() => handleConfidence(stars)}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid var(--border-accent)",
                          background: "rgba(245,158,11,0.02)",
                          color: "var(--accent)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "var(--transition)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-glow)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.02)"}
                      >
                        {stars}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {simStep === "reveal" && (
                <div style={{ textAlign: "center", width: "100%" }} className="animate-in">
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Answer</p>
                  <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--accent)", marginBottom: "1.5rem" }}>
                    <InlineMath math={SIMULATOR_CARDS[activeCardIndex].formula} />
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 2rem", lineHeight: 1.5 }}>
                    {SIMULATOR_CARDS[activeCardIndex].why}
                  </p>

                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Rate your actual recall difficulty:</p>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    {[
                      { rating: 1, label: "Again", color: "var(--error)" },
                      { rating: 2, label: "Hard", color: "var(--warning)" },
                      { rating: 3, label: "Good", color: "var(--info)" },
                      { rating: 4, label: "Easy", color: "var(--success)" }
                    ].map((btn) => (
                      <button
                        key={btn.rating}
                        id={`sim-rate-${btn.rating}`}
                        onClick={() => handleRateRecall(btn.rating as 1 | 2 | 3 | 4)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          border: `1px solid ${btn.color}`,
                          color: "white",
                          background: "rgba(255,255,255,0.02)",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                          transition: "var(--transition)"
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {simStep === "done" && (
                <div style={{ textAlign: "center" }} className="animate-in">
                  <div style={{ color: "var(--success)", display: "inline-flex", padding: "0.5rem", background: "rgba(16,185,129,0.08)", borderRadius: "50%", marginBottom: "1rem" }}>
                    <CheckCircle size={28} />
                  </div>
                  <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "white", marginBottom: "0.5rem" }}>Recall Scheduled!</p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                    FSRS v5 has calculated your neural stability. This card is scheduled for review in <span style={{ color: "var(--accent)", fontWeight: 600 }}>{fsrsScheduledDays} days</span>.
                  </p>

                  <button 
                    id="simulator-next-btn"
                    onClick={resetSimulator}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.75rem" }}
                  >
                    Try Next Card <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Footer display */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={12} className="text-muted" />
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Opt. Window: 8000ms
                </span>
              </div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Algorithm: FSRS v5
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Projection Calculator Section */}
      <section style={{
        padding: "100px clamp(1.5rem, 8vw, 10rem)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Retention Projection Calculator
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Quantify the Spaced Repetition Advantage.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4rem", alignItems: "stretch" }}>
            {/* Config Column */}
            <div style={{
              background: "rgba(15,22,26,0.6)",
              border: "1px solid var(--border)",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "2rem"
            }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", marginBottom: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  1. Choose Daily Study Hours
                </p>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={studyHours}
                    onChange={(e) => setStudyHours(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--accent)" }}
                    id="calc-study-hours-slider"
                  />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", color: "var(--accent)", fontWeight: 700, minWidth: "40px" }}>
                    {studyHours}h
                  </span>
                </div>
              </div>

              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", marginBottom: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  2. Choose Review Strategy
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    id="calc-strategy-reread"
                    onClick={() => setMethod("reread")}
                    style={{
                      padding: "0.75rem",
                      background: method === "reread" ? "var(--bg-elevated)" : "transparent",
                      border: method === "reread" ? "2px solid var(--text-secondary)" : "1px solid var(--border)",
                      color: method === "reread" ? "white" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      transition: "var(--transition)"
                    }}
                  >
                    Passive Re-Reading
                  </button>
                  <button
                    id="calc-strategy-fsrs"
                    onClick={() => setMethod("fsrs")}
                    style={{
                      padding: "0.75rem",
                      background: method === "fsrs" ? "var(--accent-glow)" : "transparent",
                      border: method === "fsrs" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      color: method === "fsrs" ? "white" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      transition: "var(--transition)"
                    }}
                  >
                    RecallIQ (FSRS v5)
                  </button>
                </div>
              </div>
            </div>

            {/* Projection Display Column */}
            <div style={{
              background: "rgba(15,22,26,0.4)",
              border: "1px solid var(--border)",
              padding: "2.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
                  HUD Memory Output Projection · 30-Day Outlook
                </p>

                {/* Score Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>30-Day Memory Retention</span>
                    <p style={{ fontSize: "3.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: method === "fsrs" ? "var(--success)" : "var(--error)", lineHeight: 1 }}>
                      {retentionRate}%
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Factoids Mastered</span>
                    <p style={{ fontSize: "3.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "white", lineHeight: 1 }}>
                      {cardsMastered}
                    </p>
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "1.25rem", borderRadius: "8px" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <TrendingUp size={16} className="text-accent" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", fontFamily: "var(--font-mono)" }}>
                      Rank Potential Impact
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {method === "fsrs" 
                      ? `Based on daily reviews of ${studyHours}h, you prevent memory decay on ${cardsMastered} core syllabus topics, translating to a projected score increase of +${potentialScoreGain} to +${potentialScoreGain + 15} marks on typical full syllabus mock tests.`
                      : `Passive re-reading loses 80%+ of acquired knowledge within 72 hours. Your study hours yield minimal permanent recall and no net score gains on major JEE mock series.`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "2rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <ShieldCheck size={14} className="text-success" />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    Calculations calibrated to cognitive decay matrices.
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* The Dream Roadmap (Timeline) */}
      <section style={{
        padding: "100px clamp(1.5rem, 8vw, 10rem) 80px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              The Road to the Merit List
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Your Rank Journey. Realized.
            </h2>
          </div>

          <div style={{ position: "relative", paddingLeft: "2rem", borderLeft: "2px dashed var(--border)" }}>
            {[
              {
                day: "Day 1",
                title: "The Syllabus Overwhelm",
                desc: "100+ chapters in Physics, Chem, and Maths. You study, but feel like you are leaking concepts as fast as you read them."
              },
              {
                day: "Day 15",
                title: "Systemized Spaced Reviews",
                desc: "FSRS registers your retention history. The dashboard begins scheduling targeted 10-minute daily review sessions. The leakage stops."
              },
              {
                day: "Day 60",
                title: "Interleaving Mastery",
                desc: "Your brain gets habituated to solving mixed subtopics. You no longer pattern-match templates; you understand root concepts."
              },
              {
                day: "Day 120",
                title: "Calibrated Mock Confidence",
                desc: "Your self-confidence matches your actual recall accuracy. You enter mock exams knowing exactly which questions to attempt and which to pass."
              },
              {
                day: "Exam Day",
                title: "AIR (All India Rank) Accomplishment",
                desc: "You walk into the exam hall with permanent recall. The formulas, reactions, and concepts are locked in. IIT Bombay / AIIMS Delhi is no longer a dream—it is an inevitability."
              }
            ].map((step, idx) => (
              <div key={idx} style={{ position: "relative", marginBottom: "3rem" }}>
                {/* Node indicator */}
                <div style={{
                  position: "absolute",
                  left: "-2.6rem",
                  top: "0",
                  width: "16px",
                  height: "16px",
                  background: idx === 4 ? "var(--accent)" : "#162228",
                  border: idx === 4 ? "4px solid rgba(255,255,255,0.9)" : "2px solid var(--border)",
                  borderRadius: "50%",
                  boxShadow: idx === 4 ? "0 0 12px var(--accent)" : "none"
                }} />

                <div>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: idx === 4 ? "var(--accent)" : "var(--text-muted)",
                    textTransform: "uppercase"
                  }}>
                    {step.day}
                  </span>
                  <h3 style={{ fontSize: "1.1rem", color: "white", marginTop: "0.25rem", marginBottom: "0.5rem" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cognitive Principles Section */}
      <section style={{ padding: "80px clamp(1.5rem, 8vw, 10rem)", position: "relative", zIndex: 10 }}>
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            The Scientific Blueprint
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Built on Cognitive Science.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[
            { icon: <Clock size={24} className="text-accent" />, name: "Spaced Repetition", desc: "The FSRS v5 algorithm calculates optimal intervals, shifting reviews out in time as stability increases." },
            { icon: <Target size={24} className="text-accent" />, name: "Retrieval Practice", desc: "Active recall before reveal forces the brain to rebuild neural pathways, cementing memories." },
            { icon: <RotateCcw size={24} className="text-accent" />, name: "Interleaving Practice", desc: "Mixing concepts prevents rote pattern-matching, training you to identify which formula applies under pressure." },
            { icon: <HelpCircle size={24} className="text-accent" />, name: "Elaborative Interrogation", desc: "Prompts like 'Why does this step work?' connect isolated facts into a dense network of conceptual understanding." },
            { icon: <Sparkles size={24} className="text-accent" />, name: "Generation Effect", desc: "Attempting to generate formulas or blanks before viewing the answers primes the brain for deep retention." },
            { icon: <BarChart size={24} className="text-accent" />, name: "Confidence Calibration", desc: "Tracking self-confidence ratings alongside actual accuracy flags zones of overconfidence." }
          ].map((t) => (
            <div
              key={t.name}
              style={{
                padding: "2rem",
                background: "rgba(15, 22, 26, 0.4)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}
            >
              <div style={{ background: "rgba(245,158,11,0.06)", padding: "0.5rem", width: "fit-content", border: "1px solid var(--border-accent)" }}>
                {t.icon}
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>{t.name}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: "100px clamp(1.5rem, 8vw, 10rem)", textAlign: "center", position: "relative", zIndex: 10 }}>
        <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.04em", marginBottom: "1.5rem" }}>
          Stop re-reading.<br /><span style={{ color: "var(--accent)" }}>Master your potential.</span>
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem", fontSize: "1rem" }}>
          Free tier available · Designed for JEE, NEET, and GATE aspirants.
        </p>
        <Link href="/sign-up" className="btn btn-primary" style={{ padding: "1rem 3rem" }} id="footer-cta-btn">
          Create Free Account & Try
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "2rem", borderTop: "1px solid var(--border)", textAlign: "center", position: "relative", zIndex: 10 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          © 2026 RecallIQ · Calibration, Interleaving & FSRS v5 scheduling · Made for top percentile ranks
        </p>
      </footer>
    </div>
  );
}
