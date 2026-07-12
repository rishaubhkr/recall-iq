"use client";

import { useState, useEffect } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import { ConfidenceRating } from "./ConfidenceRating";
import { RatingButtons } from "./RatingButtons";
import { Sparkles, HelpCircle } from "lucide-react";

interface FlashCardProps {
  front: string;
  back: string;
  whyPrompt?: string;
  mentalHook?: string;
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number, responseMs?: number) => void;
  onSaveHook?: (hook: string) => void;
}



function splitFrontContent(raw: string) {
  if (!raw) return { questionText: "", diagramText: "" };
  const content = raw.replace(/\\n/g, "\n");
  const blockRegex = /(?:^|\n)[ \t]*(?:```)?(mermaid|chart)\s*\n([\s\S]*?)(?:```|(?=\n[ \t]*\n|$))/gi;
  
  let diagramText = "";
  const questionText = content.replace(blockRegex, (match) => {
    diagramText += (diagramText ? "\n\n" : "") + match.trim();
    return "";
  }).trim();
  
  return { questionText: questionText || content, diagramText };
}

export function FlashCard({ front, back, whyPrompt, mentalHook, onRate, onSaveHook }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [xpAnim, setXpAnim] = useState<{ id: number, gain: number } | null>(null);
  const [editingHook, setEditingHook] = useState(false);
  const [hookValue, setHookValue] = useState(mentalHook || "");
  
  const { questionText, diagramText } = splitFrontContent(front);

  // Timer State
  const [startTime] = useState(Date.now());
  const [responseMs, setResponseMs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8000); // 8-second optimal recall window
  
  useEffect(() => {
    if (flipped) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 50));
    }, 50);
    return () => clearInterval(interval);
  }, [flipped]);

  const handleFlip = () => {
    if (!flipped && confidence === 0) return;
    setResponseMs(Date.now() - startTime);
    setFlipped(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    onRate(rating, confidence, responseMs);
    setFlipped(false);
    setConfidence(0);
    setShowWhy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      
      {/* Front / Question Area */}
      {!flipped ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          <div className="card" style={{ 
            minHeight: "340px", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "3rem", 
            background: "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)", 
            border: "1px solid rgba(255,255,255,0.08)", 
            borderRadius: "24px", 
            boxShadow: "0 12px 0 0 rgba(0,0,0,0.4), 0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Burn-Down Timer Bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "rgba(255,255,255,0.05)" }}>
              <div style={{ 
                height: "100%", 
                width: `${(timeLeft / 8000) * 100}%`, 
                background: timeLeft > 4000 ? "var(--accent)" : timeLeft > 2000 ? "var(--accent-amber)" : "#FF4B4B",
                transition: "width 50ms linear, background 0.3s ease"
              }} />
            </div>

            <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem", background: "rgba(255,255,255,0.05)", padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>Question</div>
            <div style={{ fontSize: "2.25rem", fontWeight: 600, textAlign: "center", lineHeight: 1.4, color: "var(--text-primary)", width: "100%" }}>
              <ContentRenderer fixEscapes>{questionText}</ContentRenderer>
            </div>
          </div>

          {confidence === 0 ? (
            <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                How well do you know this?
              </p>
              <div style={{ transform: "scale(1.3)" }}>
                <ConfidenceRating value={confidence} onChange={setConfidence} />
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%", padding: "1.5rem", fontSize: "1.25rem" }} onClick={handleFlip}>
              Check Answer
            </button>
          )}
        </div>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Question Reference Header (Formatted LaTeX & High Contrast) */}
          <div style={{ 
            textAlign: "center", 
            color: "#E2E8F0", 
            fontSize: "1.15rem", 
            fontWeight: 600, 
            lineHeight: 1.5,
            background: "rgba(30, 41, 59, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "1rem 1.75rem",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)"
          }}>
            <ContentRenderer fixEscapes>{questionText}</ContentRenderer>
          </div>

          {/* Answer Card */}
          <div className="card" style={{ 
            minHeight: "280px", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "3rem", 
            background: "linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(0,0,0,0) 100%), #0F172A", 
            border: "2px solid var(--accent)", 
            borderRadius: "24px", 
            position: "relative", 
            overflow: "visible",
            boxShadow: "0 12px 0 0 rgba(245, 158, 11, 0.15), 0 20px 40px -10px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)" 
          }}>
            <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #F59E0B, #FCD34D)", color: "#000", padding: "6px 24px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
              Answer
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, textAlign: "center", lineHeight: 1.5, color: "var(--text-primary)", width: "100%" }}>
              {diagramText && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <ContentRenderer fixEscapes>{diagramText}</ContentRenderer>
                </div>
              )}
              <ContentRenderer fixEscapes>{back}</ContentRenderer>
            </div>

            {/* Mental Hook Box (High-Contrast VIP Personal Space) */}
            <div style={{ 
              marginTop: "3.5rem",
              background: "rgba(30, 41, 59, 0.92)",
              border: "1px solid rgba(245, 158, 11, 0.45)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              padding: "1rem 1.35rem",
              fontSize: "0.92rem",
              color: "#F8FAFC",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem"
            }}>
              {editingHook ? (
                <div style={{ display: "flex", gap: "0.75rem", width: "100%", alignItems: "center" }}>
                  <input 
                    autoFocus
                    value={hookValue}
                    onChange={(e) => setHookValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSaveHook?.(hookValue);
                        setEditingHook(false);
                      }
                    }}
                    placeholder="💡 Add a mnemonic or mental hook..."
                    style={{ background: "transparent", border: "none", borderBottom: "2px solid #FCD34D", color: "#F8FAFC", outline: "none", fontSize: "0.95rem", flex: 1, paddingBottom: "0.25rem" }}
                  />
                  <button onClick={() => { onSaveHook?.(hookValue); setEditingHook(false); }} style={{ background: "#F59E0B", color: "#000", border: "none", borderRadius: "8px", padding: "0.4rem 0.9rem", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.05em" }}>SAVE</button>
                </div>
              ) : (
                <>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: hookValue ? "#F8FAFC" : "#FCD34D", fontWeight: 500 }}>
                    {hookValue ? `💡 Hook: ${hookValue}` : "💡 Add a mental hook to lock this answer in memory..."}
                  </div>
                  <button onClick={() => setEditingHook(true)} style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#FCD34D", borderRadius: "8px", padding: "0.35rem 0.85rem", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem", flexShrink: 0, letterSpacing: "0.05em" }}>
                    {hookValue ? "EDIT" : "ADD HOOK"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Explanation Area (The "Why" Section) */}
          {whyPrompt && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button 
                onClick={() => setShowWhy(!showWhy)} 
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--accent)", background: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.2)", borderRadius: "16px", padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s" }}
              >
                <HelpCircle size={18} /> {showWhy ? "HIDE EXPLANATION" : "WHY DOES THIS WORK?"}
              </button>
              
              {showWhy && (
                <div className="animate-in" style={{ background: "#1F2E35", padding: "2rem", borderRadius: "24px", border: "2px solid var(--accent-dim)", color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6, boxShadow: "var(--shadow-premium)" }}>
                  <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", color: "var(--accent)", marginBottom: "1rem", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={14} /> Deep Insight
                  </p>
                  <ContentRenderer>{whyPrompt}</ContentRenderer>
                </div>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Rate your recall
            </p>
            <RatingButtons onRate={handleRate} />
          </div>

        </div>
      )}
    </div>
  );
}
