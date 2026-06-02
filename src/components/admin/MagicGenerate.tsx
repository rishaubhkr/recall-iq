"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sparkles, Loader2, X, Check, ArrowRight, BrainCircuit, Wand2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface MagicGenerateProps {
  subtopicId: Id<"subtopics">;
  onSuccess: () => void;
}

export function MagicGenerate({ subtopicId, onSuccess }: MagicGenerateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const generate = useAction(api.ai.generateCardsFromText);
  const createCard = useMutation(api.cards.createCard);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setGeneratedCards([]);
    try {
      const cards = await generate({ text, subtopicId });
      setGeneratedCards(cards);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "AI Generation failed. Check Console or GEMINI_API_KEY.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      for (const card of generatedCards) {
        await createCard({
          subtopicId,
          type: card.type,
          tier: "free",
          front: card.front,
          back: card.back,
          options: card.options,
          correctOption: card.correctOption,
          clozeTemplate: card.clozeTemplate,
          whyPrompt: card.whyPrompt,
          tags: card.tags || [],
          createdBy: "AI-Generator",
        });
      }
      setGeneratedCards([]);
      setText("");
      alert("Success! Magic AI cards have been added to your preparation materials.");
      onSuccess();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to import some cards.");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn"
        style={{ 
          background: "linear-gradient(135deg, var(--accent-glow) 0%, rgba(245,158,11,0.05) 100%)",
          color: "var(--accent)", 
          border: "1px solid var(--border-accent)", 
          display: "flex", gap: "0.6rem", alignItems: "center",
          padding: "0.625rem 1.25rem",
          boxShadow: "var(--shadow-glow)",
          transition: "var(--spring)"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0) scale(1)"}
      >
        <Sparkles size={16} />
        <span style={{ fontWeight: 700, letterSpacing: "0.02em" }}>Magic AI Generate</span>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000, 
      display: "flex", alignItems: "center", justifyContent: "center", 
      background: "rgba(10, 11, 16, 0.85)", 
      backdropFilter: "blur(12px) saturate(180%)", 
      padding: "2rem"
    }}>
      <div 
        className="animate-in" 
        style={{ 
          maxWidth: 900, width: "100%", maxHeight: "85vh", 
          background: "var(--bg-secondary)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          borderRadius: "12px",
          position: "relative"
        }}
      >
        {/* Magic Glow Effect */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 400, height: 200, background: "var(--accent)", filter: "blur(120px)",
          opacity: 0.1, pointerEvents: "none"
        }} />
        
        {/* Header */}
        <div style={{ 
          display: "flex", justifyContent: "space-between", alignItems: "center", 
          padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.02)"
        }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: "10px", 
              background: "var(--accent-glow)", display: "flex", 
              alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border-accent)"
            }}>
              <BrainCircuit size={22} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
                AI Knowledge Extraction
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Powered by Gemini 1.5 Flash
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="btn-icon"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div style={{ flex: 1, padding: "2rem", overflowY: "auto", position: "relative" }}>
          
          {generatedCards.length === 0 ? (
            <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Our AI scans your text for core concepts, formulas, and "Why" triggers. It then generates high-fidelity flashcards using the <strong style={{ color: "var(--accent)" }}>Make It Stick</strong> methodology.
                </p>
              </div>

              <div style={{ position: "relative" }}>
                <textarea
                  className="input textarea"
                  placeholder="Paste textbook paragraph or lecture notes here..."
                  rows={12}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ 
                    resize: "none", padding: "1.5rem", fontSize: "1rem", 
                    borderRadius: "12px", background: "var(--bg-primary)",
                    border: "1px solid var(--border)"
                  }}
                />
                {!text && (
                  <div style={{ position: "absolute", bottom: "1.5rem", right: "1.5rem", opacity: 0.5 }}>
                    <Wand2 size={24} style={{ color: "var(--accent)" }} />
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="btn btn-primary"
                style={{ 
                  alignSelf: "center", padding: "1rem 3rem", fontSize: "1.1rem", 
                  borderRadius: "12px", gap: "0.75rem", fontWeight: 600,
                  boxShadow: "0 10px 30px rgba(245,158,11,0.2)"
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analysing Concepts...
                  </>
                ) : (
                  <>
                    Generate Smart Cards
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Extraction Complete</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>We've optimized these cards for long-term retention.</p>
                </div>
                <button 
                  onClick={() => setGeneratedCards([])} 
                  className="btn btn-ghost" 
                  style={{ fontSize: "0.8rem", height: "fit-content" }}
                >
                  Start Over
                </button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {generatedCards.map((c, i) => (
                  <div 
                    key={i} 
                    className="card animate-scale-in" 
                    style={{ 
                      background: "var(--bg-primary)", 
                      border: "1px solid var(--border)",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      animationDelay: `${i * 0.1}s`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ 
                        fontSize: "0.6rem", textTransform: "uppercase", 
                        fontWeight: 600, color: "var(--accent)", 
                        background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px"
                      }}>
                        {c.type}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.4, color: "var(--text-primary)" }}>
                      {c.front}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--border)", paddingLeft: "0.75rem" }}>
                      {c.back}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticky Footer for Import */}
              <div style={{ 
                position: "sticky", bottom: 0, padding: "1.5rem", 
                background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
                display: "flex", justifyContent: "flex-end", gap: "1rem", margin: "0 -2rem -2rem -2rem"
              }}>
                <button onClick={() => setIsOpen(false)} className="btn btn-ghost">Discard All</button>
                <button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 2.5rem", borderRadius: "10px", fontWeight: 600 }}
                >
                  {isImporting ? <Loader2 className="animate-spin" size={18} /> : <>Import to Study Queue <Check size={18} /></>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
