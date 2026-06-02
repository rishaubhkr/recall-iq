"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle, ArrowDown } from "lucide-react";

interface SequencingCardProps {
  front: string; // The instruction (e.g., "Order by increasing electronegativity")
  back: string;  // Detailed explanation
  options: string[]; // The items to be ordered
  advancedMetadata: {
    sequenceOrder: number[]; // The correct indices in order
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function SequencingCard({ front, back, options, advancedMetadata, onRate }: SequencingCardProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const toggleOption = (idx: number) => {
    if (revealed) return;
    if (selectedOrder.includes(idx)) {
      setSelectedOrder(prev => prev.filter(i => i !== idx));
    } else {
      setSelectedOrder(prev => [...prev, idx]);
    }
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setSelectedOrder([]);
    setConfidence(0);
    setRevealed(false);
  };

  const isCorrect = revealed && 
    selectedOrder.length === (advancedMetadata?.sequenceOrder?.length || 0) && 
    selectedOrder.every((val, index) => val === advancedMetadata?.sequenceOrder?.[index]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Question */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px" }}>
        <p style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.75rem", marginBottom: "1rem", letterSpacing: "0.1em", textAlign: "center" }}>SEQUENCING TASK</p>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
          <ReactMarkdown {...MD_OPTS}>{front.replace(/\\n/g, '\n')}</ReactMarkdown>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        {/* Selected Items (Active Sequence) */}
        <div style={{ minHeight: "80px", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "2px dashed rgba(255,255,255,0.1)", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
          {selectedOrder.length === 0 && !revealed && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Click items in order...</p>}
          {selectedOrder.map((idx, pos) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "#000", borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem" }}>
                {options[idx]}
              </div>
              {pos < selectedOrder.length - 1 && <ArrowDown size={14} color="var(--text-muted)" />}
            </div>
          ))}
        </div>

        {/* Options to select from */}
        {!revealed && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}>
            {options.map((opt, idx) => {
              const isSelected = selectedOrder.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleOption(idx)}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: isSelected ? "rgba(255,255,255,0.05)" : "var(--bg-elevated)",
                    border: `2px solid ${isSelected ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "12px",
                    color: isSelected ? "var(--text-muted)" : "var(--text-primary)",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: isSelected ? 0.5 : 1,
                    transition: "all 0.2s"
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
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
            disabled={selectedOrder.length !== options.length}
          >
            Check Sequence
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "var(--accent)" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "var(--accent)" : "#FF4B4B", marginBottom: "1rem" }}>
                {isCorrect ? "CORRECT SEQUENCE!" : "INCORRECT SEQUENCE"}
             </p>
             
             {/* Correct Sequence Display */}
             <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, width: "100%", marginBottom: "0.5rem" }}>CORRECT ORDER:</p>
                {(advancedMetadata?.sequenceOrder || []).map((idx, pos) => (
                   <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                     <span style={{ fontWeight: 600, color: "var(--accent)" }}>{options?.[idx]}</span>
                     {pos < (advancedMetadata?.sequenceOrder?.length || 0) - 1 && <span style={{ color: "var(--text-muted)" }}>→</span>}
                   </div>
                ))}
             </div>

             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
               <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
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
