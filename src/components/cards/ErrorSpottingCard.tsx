"use client";

import { useState } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface ErrorSpottingCardProps {
  front: string; // The multi-line derivation
  back: string;  // Explanation of the correct step
  advancedMetadata: {
    errorLine: number; // 0-indexed index of the line containing the error
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}


export function ErrorSpottingCard({ front, back, advancedMetadata, onRate }: ErrorSpottingCardProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const rawLines = front.replace(/\\n/g, '\n').split('\n').filter(l => l.trim() !== "");
  
  let instruction = "";
  let lines = rawLines;
  
  // Extract AI prompt instruction from the first line so it's not a clickable derivation step
  if (rawLines.length > 0) {
    const firstLine = rawLines[0].toLowerCase();
    if (firstLine.includes("identify") || firstLine.includes("error in") || firstLine.endsWith(":")) {
      instruction = rawLines[0];
      lines = rawLines.slice(1);
    }
  }

  // Defensive: Normalize 1-indexed to 0-indexed if necessary
  // If metadata says line 1, and we only have 1 line, it's index 0.
  // Most AI's start counting at 1.
  const rawErrorLine = advancedMetadata?.errorLine ?? 0;
  const normalizedErrorLine = (rawErrorLine > 0 && rawErrorLine >= lines.length) 
    ? rawErrorLine - 1 
    : rawErrorLine;

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const isCorrect = selectedLine === normalizedErrorLine;
    onRate(rating, confidence);
    setSelectedLine(null);
    setConfidence(0);
    setRevealed(false);
  };

  const isCorrect = revealed && selectedLine === normalizedErrorLine;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600, color: "#FF4B4B", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <AlertTriangle size={16} /> Identify the Error
        </p>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Click on the line where the first logical error occurs.
        </p>
        {instruction && (
          <div style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginTop: "1rem", fontWeight: 600 }}>
            <ContentRenderer>{instruction}</ContentRenderer>
          </div>
        )}
      </div>

      {/* Derivation Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {lines.map((line, idx) => {
          const isSelected = selectedLine === idx;
          const isTarget = idx === normalizedErrorLine;
          
          let borderColor = "rgba(255,255,255,0.05)";
          let bg = "rgba(255,255,255,0.02)";

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
              key={idx}
              onClick={() => !revealed && setSelectedLine(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1rem 1.5rem",
                background: bg,
                border: `2px solid ${borderColor}`,
                borderRadius: "12px",
                cursor: revealed ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                width: "100%"
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: "6px", background: "rgba(255,255,255,0.05)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0
              }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, fontSize: "1.1rem", fontWeight: 600 }}>
                <ContentRenderer>{line}</ContentRenderer>
              </div>
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Confidence</p>
            <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.25rem" }} 
            onClick={() => setRevealed(true)}
            disabled={selectedLine === null}
          >
            Check Selection
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "#10B981" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "#10B981" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {isCorrect ? "STEP IDENTIFIED!" : "MISS-IDENTIFIED"}
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
