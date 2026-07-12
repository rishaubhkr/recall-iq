"use client";

import { useState, useMemo } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";

interface MatrixMatchCardProps {
  front: string;
  back: string;
  advancedMetadata: {
    matrixA: string[];
    matrixB: string[];
    matrixMapping: Record<string, number[]>;
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}


export function MatrixMatchCard({ front, back, advancedMetadata, onRate }: MatrixMatchCardProps) {
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [currentMapping, setCurrentMapping] = useState<Record<number, number[]>>({});
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const shuffledBIndices = useMemo(() => {
    const bCount = (advancedMetadata?.matrixB || []).length;
    const indices = Array.from({ length: bCount }, (_, i) => i);
    if (bCount <= 1) return indices;

    const mapping = advancedMetadata?.matrixMapping || {};

    // Helper to check if ANY row i in Column B is directly across from its answer in Column A row i
    const hasParallelMatch = (arr: number[]) => {
      return arr.some((bIdx, rowIdx) => {
        const targetForA = mapping[rowIdx] || mapping[String(rowIdx)] || [];
        return targetForA.includes(bIdx);
      });
    };

    // First try rotational shift by 1, 2, ... until no row is parallel to its match
    for (let shift = 1; shift < bCount; shift++) {
      const candidate = indices.map((_, i) => indices[(i + shift) % bCount]);
      if (!hasParallelMatch(candidate)) {
        return candidate;
      }
    }

    // Next try reversing or alternating
    const reversed = [...indices].reverse();
    if (!hasParallelMatch(reversed)) return reversed;

    // Guaranteed fallback for N >= 2: rotate by 1 so Column B is shifted relative to Column A
    return indices.map((_, i) => indices[(i + 1) % bCount]);
  }, [advancedMetadata]);

  const handleSelectA = (idx: number) => {
    if (revealed) return;
    setSelectedA(idx);
  };

  const handleSelectB = (idx: number) => {
    if (revealed || selectedA === null) return;
    
    setCurrentMapping(prev => {
      const existing = prev[selectedA!] || [];
      const updated = existing.includes(idx) 
        ? existing.filter(i => i !== idx)
        : [...existing, idx];
      return { ...prev, [selectedA!]: updated };
    });
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setSelectedA(null);
    setCurrentMapping({});
    setConfidence(0);
    setRevealed(false);
  };

  const checkCorrectness = () => {
    const target = advancedMetadata.matrixMapping;
    // Check if every A in currentMapping matches target mapping exactly
    for (let i = 0; i < advancedMetadata.matrixA.length; i++) {
      const userMatches = (currentMapping[i] || []).sort();
      const targetMatches = (target[i] || []).sort();
      if (userMatches.length !== targetMatches.length || !userMatches.every((v, idx) => v === targetMatches[idx])) {
        return false;
      }
    }
    return true;
  };

  const isCorrect = revealed && checkCorrectness();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Question */}
      <div className="card" style={{ padding: "2rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px" }}>
        <p style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.75rem", marginBottom: "1rem", letterSpacing: "0.1em", textAlign: "center" }}>MATRIX MATCHING</p>
        <div style={{ fontSize: "1.5rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
          <ContentRenderer fixEscapes>{front}</ContentRenderer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Column A */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textAlign: "center", textTransform: "uppercase" }}>Column A</p>
          {(advancedMetadata?.matrixA || []).length === 0 ? (
            <div style={{ padding: "1rem", background: "rgba(255, 75, 75, 0.1)", borderRadius: "12px", border: "1px dashed #FF4B4B", color: "#FF4B4B", fontSize: "0.8rem", textAlign: "center" }}>
              Missing Metadata (Matrix A)
            </div>
          ) : (
            (advancedMetadata?.matrixA || []).map((text, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectA(idx)}
                style={{
                  padding: "1rem",
                  background: selectedA === idx ? "rgba(245, 158, 11, 0.15)" : "var(--bg-elevated)",
                  border: `2px solid ${selectedA === idx ? "var(--accent)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textAlign: "left",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ flex: 1 }}><ContentRenderer>{text}</ContentRenderer></div>
                  {Object.keys(currentMapping[idx] || {}).length > 0 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginLeft: "0.5rem" }} />}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Column B */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textAlign: "center", textTransform: "uppercase" }}>Column B</p>
          {(advancedMetadata?.matrixB || []).length === 0 ? (
            <div style={{ padding: "1rem", background: "rgba(255, 75, 75, 0.1)", borderRadius: "12px", border: "1px dashed #FF4B4B", color: "#FF4B4B", fontSize: "0.8rem", textAlign: "center" }}>
              Missing Metadata (Matrix B)
            </div>
          ) : (
            shuffledBIndices.map((originalIdx) => {
              const text = advancedMetadata?.matrixB?.[originalIdx];
              const isMatchedToSelected = selectedA !== null && (currentMapping[selectedA] || []).includes(originalIdx);
              return (
                <button
                  key={originalIdx}
                  onClick={() => handleSelectB(originalIdx)}
                  style={{
                    padding: "1rem",
                    background: isMatchedToSelected ? "rgba(88, 204, 2, 0.1)" : "var(--bg-elevated)",
                    border: `2px solid ${isMatchedToSelected ? "var(--success)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textAlign: "left",
                    opacity: selectedA === null ? 0.6 : 1
                  }}
                >
                  <ContentRenderer>{text}</ContentRenderer>
                </button>
              );
            })
          )}
        </div>
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
            disabled={Object.keys(currentMapping).length === 0}
          >
            Check Mapping
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "#10B981" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "#10B981" : "#FF4B4B", marginBottom: "1rem" }}>
                {isCorrect ? "CORRECT MATCHING!" : "INCORRECT MATCHING"}
             </p>
             
             {/* Correct Mapping Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {(advancedMetadata?.matrixA || []).map((text, idx) => (
                  <div key={idx} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      <ContentRenderer>{text}</ContentRenderer>
                    </div>
                    <span>→</span>
                    <div style={{ color: "#10B981", display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
                      {(advancedMetadata?.matrixMapping?.[idx] || []).map((i, subIdx) => (
                        <div key={i} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                          <ContentRenderer>{advancedMetadata?.matrixB?.[i]}</ContentRenderer>
                          {subIdx < (advancedMetadata?.matrixMapping?.[idx] || []).length - 1 && <span>,</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
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
