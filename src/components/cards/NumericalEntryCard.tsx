"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle } from "lucide-react";

interface NumericalEntryCardProps {
  front: string;
  back: string;
  advancedMetadata: {
    numericalAnswer: number;
    numericalTolerance?: number;
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function NumericalEntryCard({ front, back, advancedMetadata, onRate }: NumericalEntryCardProps) {
  const [value, setValue] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const num = parseFloat(value);
    const target = advancedMetadata?.numericalAnswer ?? 0;
    const tol = advancedMetadata?.numericalTolerance ?? 0.1;
    
    const correct = !isNaN(num) && Math.abs(num - target) <= tol;
    setIsCorrect(correct);
    setRevealed(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setValue("");
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

      {!revealed ? (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.5rem", textAlign: "center" }}>Enter Numerical Value</p>
            <input 
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                padding: "1.25rem",
                fontSize: "1.5rem",
                textAlign: "center",
                background: "rgba(255,255,255,0.05)",
                border: "2px solid var(--border)",
                borderRadius: "16px",
                color: "var(--text-primary)",
                fontWeight: 600,
                outline: "none"
              }}
              placeholder="0.00"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>How confident are you?</p>
            <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.25rem", fontSize: "1.1rem" }}
            onClick={handleSubmit}
            disabled={!value}
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ 
            background: "var(--bg-elevated)", 
            padding: "2rem", 
            borderRadius: "24px", 
            borderLeft: `8px solid ${isCorrect ? "var(--accent)" : "#FF4B4B"}`,
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              {isCorrect ? <CheckCircle2 color="var(--accent)" /> : <XCircle color="#FF4B4B" />}
              <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "1rem", color: isCorrect ? "var(--accent)" : "#FF4B4B" }}>
                {isCorrect ? "CORRECT" : "INCORRECT"}
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5rem" }}>Your Answer</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{value}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5rem" }}>Correct Answer</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--accent)" }}>{advancedMetadata?.numericalAnswer}</p>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
                <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
              </div>
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
