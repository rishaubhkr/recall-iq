"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { Link2 } from "lucide-react";

interface ConceptInterleaveCardProps {
  front: string; // The two terms to connect
  back: string;  // Detailed explanation of the link
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function ConceptInterleaveCard({ front, back, onRate }: ConceptInterleaveCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [explanation, setExplanation] = useState("");

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setRevealed(false);
    setConfidence(0);
    setExplanation("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Terms */}
      <div className="card" style={{ padding: "3rem", background: "var(--bg-elevated)", border: "4px solid #37464F", borderRadius: "24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link2 size={16} /> Interleave Concepts
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", marginTop: "1rem" }}>
           <div style={{ fontSize: "1.5rem", fontWeight: 600, textAlign: "center" }}>
             <ReactMarkdown {...MD_OPTS}>{front.replace(/\\n/g, '\n')}</ReactMarkdown>
           </div>
           <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>Explain the fundamental connection between these terms.</p>
        </div>
      </div>

      {!revealed ? (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <textarea 
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="How do these concepts interact? (e.g. A is used to derive B...)"
            style={{
              width: "100%",
              padding: "1.5rem",
              minHeight: "150px",
              background: "rgba(255,255,255,0.03)",
              border: "2px solid var(--border)",
              borderRadius: "20px",
              color: "var(--text-primary)",
              fontSize: "1.1rem",
              outline: "none",
              resize: "none"
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Confidence</p>
            <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.25rem" }} 
            onClick={() => setRevealed(true)}
            disabled={!explanation}
          >
            Reveal Connection
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", border: "2px solid var(--accent)" }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: "var(--accent)", marginBottom: "1rem", letterSpacing: "0.1em" }}>THE LINK</p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Mastery</p>
            <RatingButtons onRate={handleRate} />
          </div>
        </div>
      )}
    </div>
  );
}
