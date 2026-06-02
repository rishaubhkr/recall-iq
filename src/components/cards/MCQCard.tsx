"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle } from "lucide-react";

interface MCQCardProps {
  front: string;
  options: string[];
  correctOption: number;
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function MCQCard({ front, options, correctOption, back, onRate }: MCQCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setSelected(null);
    setConfidence(0);
    setRevealed(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Question */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px" }}>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
          <ReactMarkdown {...MD_OPTS}>{front.replace(/\\n/g, '\n')}</ReactMarkdown>
        </div>
      </div>

      {/* Confidence (Before answering) */}
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
          const isCorrect = idx === correctOption;
          const isSelected = idx === selected;
          
          let borderColor = "#37464F";
          let bg = "transparent";
          let icon = null;

          if (revealed) {
            if (isCorrect) {
              borderColor = "var(--accent)";
              bg = "rgba(88, 204, 2, 0.1)";
              icon = <CheckCircle2 size={24} style={{ color: "var(--accent)" }} />;
            } else if (isSelected) {
              borderColor = "#FF4B4B";
              bg = "rgba(255, 75, 75, 0.1)";
              icon = <XCircle size={24} style={{ color: "#FF4B4B)" }} />;
            }
          } else if (isSelected) {
            borderColor = "var(--accent)";
            bg = "rgba(245, 158, 11, 0.08)";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
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
                transition: "all 0.2s",
                boxShadow: isSelected && !revealed ? "0 4px 0 0 rgba(0,0,0,0.2)" : "none"
              }}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: "8px", background: "var(--bg-elevated)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: "1rem", color: "var(--text-muted)", flexShrink: 0
              }}>
                {String.fromCharCode(65 + idx)}
              </div>
              <div style={{ flex: 1, fontSize: "1.1rem", fontWeight: 700 }}>
                <ReactMarkdown {...MD_OPTS}>{opt}</ReactMarkdown>
              </div>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Result Section */}
      {revealed && (
        <div className="animate-in" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${selected === correctOption ? "var(--accent)" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: selected === correctOption ? "var(--accent)" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {selected === correctOption ? "CORRECT!" : "INCORRECT"}
             </p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Difficulty</p>
            <RatingButtons onRate={handleRate} wasCorrect={selected === correctOption} />
          </div>
        </div>
      )}
    </div>
  );
}
