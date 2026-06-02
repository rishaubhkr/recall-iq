"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { Eye, EyeOff } from "lucide-react";

interface Box {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
  label: string;
}

interface ImageOcclusionCardProps {
  front: string; // The instruction/title
  back: string;  // Detailed explanation
  advancedMetadata: {
    imageUrl: string;
    boxes: Box[];
  };
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export function ImageOcclusionCard({ front, back, advancedMetadata, onRate }: ImageOcclusionCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence);
    setConfidence(0);
    setRevealed(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Image Occlusion</p>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.5rem" }}>
           <ReactMarkdown {...MD_OPTS}>{front.replace(/\\n/g, '\n')}</ReactMarkdown>
        </div>
      </div>

      {/* Image Area */}
      <div style={{ 
        position: "relative", 
        width: "100%", 
        borderRadius: "24px", 
        overflow: "hidden", 
        border: "4px solid #37464F",
        background: "#000"
      }}>
        <img 
          src={advancedMetadata.imageUrl} 
          alt="Occlusion context" 
          style={{ width: "100%", display: "block", opacity: revealed ? 1 : 0.8 }} 
        />
        
        {/* Occlusion Boxes */}
        {advancedMetadata.boxes.map((box, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              background: revealed ? "transparent" : "var(--accent)",
              border: `2px solid ${revealed ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
              boxShadow: revealed ? "none" : "0 4px 12px rgba(0,0,0,0.5)"
            }}
          >
            {revealed ? (
              <span style={{ 
                background: "rgba(0,0,0,0.8)", 
                color: "var(--accent)", 
                fontSize: "0.7rem", 
                fontWeight: 600, 
                padding: "2px 6px", 
                borderRadius: "4px",
                whiteSpace: "nowrap",
                pointerEvents: "none"
              }}>
                {box.label}
              </span>
            ) : (
              <span style={{ color: "#000", fontWeight: 600, fontSize: "0.8rem" }}>?</span>
            )}
          </div>
        ))}
      </div>

      {!revealed ? (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Confidence</p>
            <ConfidenceRating value={confidence} onChange={setConfidence} size="sm" />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }} 
            onClick={() => setRevealed(true)}
          >
            <Eye size={20} /> Reveal Labels
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: "8px solid var(--accent)" }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: "var(--accent)", marginBottom: "1rem" }}>Deep Insight</p>
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
