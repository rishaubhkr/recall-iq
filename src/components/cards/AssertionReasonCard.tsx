"use client";

import { useState } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle } from "lucide-react";

interface AssertionReasonCardProps {
  front: string; // The specific question context if any
  back: string;  // Detailed explanation
  advancedMetadata: {
    assertion: string;
    reason: string;
    correctAssertionReasonKey: "A" | "B" | "C" | "D" | "E";
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}


const KEYS = {
  A: "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
  B: "Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.",
  C: "Assertion is true, but Reason is false.",
  D: "Assertion is false, but Reason is true.",
  E: "Both Assertion and Reason are false."
};

export function AssertionReasonCard({ front, back, advancedMetadata, onRate }: AssertionReasonCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const isCorrect = selected === advancedMetadata.correctAssertionReasonKey;
    onRate(rating, confidence);
    setSelected(null);
    setConfidence(0);
    setRevealed(false);
  };

  const isCorrect = revealed && selected === advancedMetadata.correctAssertionReasonKey;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Removed redundant 'front' text rendering to prevent duplicate Assertion/Reason text */}

      {/* Assertion & Reason */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "2rem", background: "var(--bg-elevated)", border: "2px solid #37464F", borderRadius: "20px" }}>
          <p style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.75rem", marginBottom: "0.75rem", letterSpacing: "0.1em" }}>ASSERTION</p>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            <ContentRenderer fixEscapes>{advancedMetadata?.assertion || ""}</ContentRenderer>
          </div>
        </div>
        <div className="card" style={{ padding: "2rem", background: "var(--bg-elevated)", border: "2px solid #37464F", borderRadius: "20px" }}>
          <p style={{ fontWeight: 600, color: "var(--accent-amber)", fontSize: "0.75rem", marginBottom: "0.75rem", letterSpacing: "0.1em" }}>REASON</p>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            <ContentRenderer fixEscapes>{advancedMetadata?.reason || ""}</ContentRenderer>
          </div>
        </div>
      </div>

      {!revealed && (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Confidence</p>
          <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
        </div>
      )}

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        {Object.entries(KEYS).map(([key, label]) => {
          const isSelected = selected === key;
          const isTarget = key === advancedMetadata.correctAssertionReasonKey;
          
          let borderColor = "#37464F";
          let bg = "transparent";

          if (revealed) {
            if (isTarget) {
              borderColor = "#10B981";
              bg = "rgba(88, 204, 2, 0.1)";
            } else if (isSelected) {
              borderColor = "#FF4B4B";
              bg = "rgba(255, 75, 75, 0.1)";
            }
          } else if (isSelected) {
            borderColor = "var(--accent)";
            bg = "rgba(245, 158, 11, 0.08)";
          }

          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              disabled={revealed}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1rem 1.5rem",
                background: bg,
                border: `3px solid ${borderColor}`,
                borderRadius: "16px",
                cursor: revealed ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div style={{ 
                width: 28, height: 28, borderRadius: "6px", background: "var(--bg-elevated)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: "0.9rem", color: "var(--text-muted)", flexShrink: 0
              }}>
                {key}
              </div>
              <div style={{ flex: 1, fontSize: "0.95rem", fontWeight: 600 }}>{label}</div>
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <button 
          className="btn btn-primary" 
          style={{ width: "100%", padding: "1.25rem" }} 
          onClick={() => setRevealed(true)}
          disabled={!selected}
        >
          Check Answer
        </button>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "#10B981" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "#10B981" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {isCorrect ? "CORRECT!" : "INCORRECT"}
             </p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ContentRenderer fixEscapes>{back}</ContentRenderer>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Difficulty</p>
            <RatingButtons onRate={handleRate} wasCorrect={isCorrect} />
          </div>
        </div>
      )}
    </div>
  );
}
