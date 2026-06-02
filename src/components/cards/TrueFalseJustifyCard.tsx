"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { CheckCircle2, XCircle } from "lucide-react";

interface TrueFalseJustifyCardProps {
  front: string;
  back: string;
  advancedMetadata: {
    justification: string;
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function TrueFalseJustifyCard({ front, back, advancedMetadata, onRate }: TrueFalseJustifyCardProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [justification, setJustification] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // We assume the front contains a statement. The "back" tells us if it's T or F.
  // The AI prompt specifies "back" as the explanation.
  // For T/F, we need to know the correct answer. I'll assume the first word of 'back' or a flag.
  // Actually, let's use the advancedMetadata to store the correct answer.
  // I'll update the AI prompt in the next Turn to include correctTF.
  
  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setSelected(null);
    setJustification("");
    setConfidence(0);
    setRevealed(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Statement */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px" }}>
         <p style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.75rem", marginBottom: "1rem", letterSpacing: "0.1em", textAlign: "center" }}>IS THIS STATEMENT TRUE?</p>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
          <ReactMarkdown {...MD_OPTS}>{front.replace(/\\n/g, '\n')}</ReactMarkdown>
        </div>
      </div>

      {!revealed ? (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <button 
              onClick={() => setSelected(true)}
              className="card"
              style={{ 
                padding: "1.5rem", 
                fontSize: "1.25rem", 
                fontWeight: 600, 
                background: selected === true ? "rgba(88, 204, 2, 0.1)" : "transparent",
                border: `4px solid ${selected === true ? "var(--accent)" : "#37464F"}`,
                borderRadius: "16px",
                transition: "all 0.2s"
              }}
            >
              TRUE
            </button>
            <button 
              onClick={() => setSelected(false)}
              className="card"
              style={{ 
                padding: "1.5rem", 
                fontSize: "1.25rem", 
                fontWeight: 600, 
                background: selected === false ? "rgba(255, 75, 75, 0.1)" : "transparent",
                border: `4px solid ${selected === false ? "#FF4B4B" : "#37464F"}`,
                borderRadius: "16px",
                transition: "all 0.2s"
              }}
            >
              FALSE
            </button>
          </div>

          <div style={{ width: "100%" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Brief Justification (Why?)</p>
            <textarea 
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain your reasoning..."
              style={{
                width: "100%",
                padding: "1rem",
                minHeight: "100px",
                background: "rgba(255,255,255,0.05)",
                border: "2px solid var(--border)",
                borderRadius: "16px",
                color: "var(--text-primary)",
                fontSize: "1rem",
                outline: "none",
                resize: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Confidence</p>
            <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.25rem" }} 
            onClick={() => setRevealed(true)}
            disabled={selected === null || !justification}
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", border: "2px solid rgba(255,255,255,0.1)" }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: "var(--accent)", marginBottom: "1rem", letterSpacing: "0.1em" }}>EXPLANATION</p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
             </div>
             {advancedMetadata?.justification && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>IDEAL JUSTIFICATION</p>
                  <p style={{ fontSize: "0.95rem", fontStyle: "italic" }}>{advancedMetadata.justification}</p>
                </div>
             )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Effort</p>
            <RatingButtons onRate={handleRate} />
          </div>
        </div>
      )}
    </div>
  );
}
