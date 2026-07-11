"use client";

import { useState } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle, Square, CheckSquare } from "lucide-react";

interface MultiSelectCardProps {
  front: string;
  options: string[];
  advancedMetadata: {
    correctOptions: number[];
  };
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}


export function MultiSelectCard({ front, options, advancedMetadata, back, onRate }: MultiSelectCardProps) {
  const correctOptions = (advancedMetadata?.correctOptions || []).map(idx => Number(idx)); // Ensure numbers
  
  const [selected, setSelected] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const toggleOption = (idx: number) => {
    if (revealed) return;
    setSelected(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = () => {
    setRevealed(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const isCorrect = selected.length === correctOptions.length && 
                     selected.every(i => correctOptions.includes(i));
    onRate(rating, confidence);
    setSelected([]);
    setConfidence(0);
    setRevealed(false);
  };

  const isAllCorrect = revealed && 
    selected.length === correctOptions.length && 
    selected.every(i => correctOptions.includes(i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Question */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px" }}>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
          <ContentRenderer fixEscapes>{front}</ContentRenderer>
        </div>
      </div>

      {!revealed && (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            How confident are you?
          </p>
          <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
        </div>
      )}

      {/* Options Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        {options.map((opt, idx) => {
          const isCorrect = correctOptions.includes(idx);
          const isSelected = selected.includes(idx);
          
          let borderColor = "#37464F";
          let bg = "transparent";
          let icon = isSelected ? <CheckSquare size={24} color="var(--accent)" /> : <Square size={24} color="var(--text-muted)" />;

          if (revealed) {
            if (isCorrect) {
              borderColor = "#10B981";
              bg = "rgba(88, 204, 2, 0.1)";
              icon = <CheckSquare size={24} color="#10B981" />;
            } else if (isSelected) {
              borderColor = "#FF4B4B";
              bg = "rgba(255, 75, 75, 0.1)";
              icon = <XCircle size={24} color="#FF4B4B" />;
            }
          } else if (isSelected) {
            borderColor = "var(--accent)";
            bg = "rgba(245, 158, 11, 0.08)";
          }

          return (
            <button
              key={idx}
              onClick={() => toggleOption(idx)}
              disabled={revealed}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1.25rem 2rem",
                background: bg,
                border: `4px solid ${borderColor}`,
                borderRadius: "20px",
                cursor: revealed ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              {icon}
              <div style={{ flex: 1, fontSize: "1.1rem", fontWeight: 700 }}>
                <ContentRenderer>{opt}</ContentRenderer>
              </div>
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <button 
          className="btn btn-primary" 
          style={{ width: "100%", padding: "1.25rem" }} 
          onClick={handleSubmit}
          disabled={selected.length === 0}
        >
          Check Answer
        </button>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isAllCorrect ? "#10B981" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isAllCorrect ? "#10B981" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {isAllCorrect ? "CORRECT!" : "INCORRECT"}
             </p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ContentRenderer fixEscapes>{back}</ContentRenderer>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Difficulty</p>
            <RatingButtons onRate={handleRate} wasCorrect={isAllCorrect} />
          </div>
        </div>
      )}
    </div>
  );
}
