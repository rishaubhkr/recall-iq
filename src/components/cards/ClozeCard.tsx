"use client";

import { useState, useRef, useEffect } from "react";
import { ContentRenderer } from "@/components/mdx/ContentRenderer";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { RatingButtons } from "./RatingButtons";
import { HelpCircle, Sparkles } from "lucide-react";
import { fuzzyMatch } from "@/lib/fuzzy";

interface ClozeCardProps {
  front: string;
  clozeTemplate: string;
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { 
  remarkPlugins: [remarkMath], 
  rehypePlugins: [rehypeKatex],
  allowedElements: ['span', 'strong', 'em', 'del', 'code', 'math', 'inlineMath', 'sub', 'sup', 'text'],
  unwrapDisallowed: true,
  components: {
    p: ({ children }: any) => <>{children}</>,
    br: () => <> </>
  }
};

interface ClozeToken {
  type: "text" | "blank";
  content: string;
  blankIndex?: number;
}

export function ClozeCard({ front, clozeTemplate, back, onRate }: ClozeCardProps) {
  // Parse multiple blanks globally
  const [tokens, setTokens] = useState<ClozeToken[]>([]);
  const [blanks, setBlanks] = useState<Array<{ index: number; answer: string }>>([]);
  
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  
  const [revealed, setRevealed] = useState(false);
  const [isCorrectMap, setIsCorrectMap] = useState<Record<number, boolean>>({});
  const [isTypoMap, setIsTypoMap] = useState<Record<number, boolean>>({});
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    // Split by global regex match
    const rawTokens = clozeTemplate.split(/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/g);
    const parsedTokens: ClozeToken[] = [];
    const parsedBlanks: Array<{ index: number; answer: string }> = [];
    
    let blankCounter = 0;
    for (let i = 0; i < rawTokens.length; i++) {
      if (i % 2 === 0) {
        if (rawTokens[i]) {
          parsedTokens.push({ type: "text", content: rawTokens[i] });
        }
      } else {
        parsedTokens.push({ type: "blank", content: rawTokens[i], blankIndex: blankCounter });
        parsedBlanks.push({ index: blankCounter, answer: rawTokens[i] });
        blankCounter++;
      }
    }
    
    setTokens(parsedTokens);
    setBlanks(parsedBlanks);
  }, [clozeTemplate]);

  const handleInputChange = (idx: number, val: string) => {
    setUserInputs(prev => ({ ...prev, [idx]: val }));
  };

  const handleCheck = () => {
    const correctMap: Record<number, boolean> = {};
    const typoMap: Record<number, boolean> = {};
    let allCorrect = true;
    
    blanks.forEach(b => {
      const matchResult = fuzzyMatch(userInputs[b.index] || "", b.answer);
      correctMap[b.index] = matchResult.isCorrect;
      typoMap[b.index] = matchResult.isTypo;
      if (!matchResult.isCorrect) allCorrect = false;
    });
    
    setIsCorrectMap(correctMap);
    setIsTypoMap(typoMap);
    setIsCorrect(allCorrect);
    setRevealed(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const autoConfidence = isCorrect ? 4 : 2;
    onRate(rating, autoConfidence);
    setUserInputs({});
    setActiveInputIndex(null);
    setRevealed(false);
    setIsCorrect(null);
    setIsCorrectMap({});
    setIsTypoMap({});
  };

  const insertSymbol = (symbol: string) => {
    if (activeInputIndex === null) return;
    const inputEl = inputRefs.current[activeInputIndex];
    if (!inputEl) return;
    
    const start = inputEl.selectionStart ?? 0;
    const end = inputEl.selectionEnd ?? 0;
    const text = inputEl.value;
    
    let insertValue = symbol;
    let cursorOffset = symbol.length;
    
    // Custom insert behavior for complex tags
    if (symbol === "√") {
      insertValue = "\\sqrt{}";
      cursorOffset = 6; // put cursor inside curly braces
    } else if (symbol === "π") {
      insertValue = "\\pi";
      cursorOffset = 3;
    } else if (symbol === "θ") {
      insertValue = "\\theta";
      cursorOffset = 6;
    }
    
    const newValue = text.substring(0, start) + insertValue + text.substring(end);
    handleInputChange(activeInputIndex, newValue);
    
    // Focus and position cursor in next tick
    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Context Question Area */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #2A3C44", borderRadius: "24px" }}>
        <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.8rem", color: "var(--accent)", marginBottom: "1rem", letterSpacing: "0.1em" }}>Fill in the blank</p>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.5 }}>
          <ContentRenderer fixEscapes>
            {front.replace(/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/g, "_____")}
          </ContentRenderer>
        </div>
      </div>

      {/* Input Inline Area */}
      <div className="card" style={{ 
        padding: "2rem", 
        borderRadius: "24px", 
        border: "4px solid #37464F",
        lineHeight: 2.2,
        fontSize: "1.25rem",
        fontWeight: 600,
        whiteSpace: "normal"
      }}>
        {tokens.map((token, idx) => {
          if (token.type === "text") {
            // Strip newlines AND any leading/trailing multiple spaces to prevent Markdown code blocks
            const inlineContent = token.content.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ");
            return (
              <span key={idx} className="cloze-text-chunk" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                <ReactMarkdown {...MD_OPTS}>{inlineContent}</ReactMarkdown>
              </span>
            );
          } else {
            const bIdx = token.blankIndex!;
            const isBlankRevealed = revealed;
            const isBlankCorrect = isCorrectMap[bIdx];
            const isBlankTypo = isTypoMap[bIdx];
            
            return (
              <span key={idx} style={{ display: "inline-block" }}>
                {!isBlankRevealed ? (
                  <input
                    ref={el => { inputRefs.current[bIdx] = el; }}
                    type="text"
                    value={userInputs[bIdx] || ""}
                    onFocus={() => setActiveInputIndex(bIdx)}
                    onChange={(e) => handleInputChange(bIdx, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !revealed && handleCheck()}
                    placeholder="..."
                    style={{
                      border: activeInputIndex === bIdx ? "3px solid var(--accent)" : "3px solid var(--bg-elevated)",
                      borderRadius: "12px",
                      background: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.25rem",
                      padding: "0.4rem 0.6rem",
                      minWidth: Math.max(50, token.content.length * 12),
                      width: Math.max(50, token.content.length * 12),
                      outline: "none",
                      transition: "all 0.2s",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                      verticalAlign: "middle"
                    }}
                  />
                ) : (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.4rem 0.6rem",
                      border: `3px solid ${isBlankCorrect ? (isBlankTypo ? "var(--accent-amber)" : "#10B981") : "#FF4B4B"}`,
                      borderRadius: "12px",
                      background: "var(--bg-primary)",
                      color: isBlankCorrect ? (isBlankTypo ? "var(--accent-amber)" : "#10B981") : "#FF4B4B",
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      verticalAlign: "middle",
                      position: "relative"
                    }}
                  >
                    {token.content}
                    {isBlankTypo && (
                      <span style={{
                        position: "absolute",
                        bottom: "-20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "0.6rem",
                        color: "var(--accent-amber)",
                        whiteSpace: "nowrap",
                        textTransform: "uppercase"
                      }}>
                        Typo
                      </span>
                    )}
                  </span>
                )}
              </span>
            );
          }
        })}
      </div>

      {/* Branded HUD Math Keyboard Ribbon */}
      {!revealed && activeInputIndex !== null && (
        <div className="animate-in" style={{
          background: "rgba(15, 22, 26, 0.85)",
          border: "2px solid var(--border-accent)",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "center",
          gap: "0.75rem",
          borderRadius: "16px",
          backdropFilter: "blur(8px)",
          boxShadow: "var(--shadow-glow)"
        }}>
          {[
            { label: "√x", sym: "√" },
            { label: "/", sym: "/" },
            { label: "x²", sym: "^2" },
            { label: "xʸ", sym: "^" },
            { label: "π", sym: "π" },
            { label: "θ", sym: "θ" },
            { label: "(", sym: "(" },
            { label: ")", sym: ")" }
          ].map((key, kIdx) => (
            <button
              key={kIdx}
              onClick={() => insertSymbol(key.sym)}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.95rem",
                padding: "0.5rem 1rem",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "var(--spring)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--accent)"; }}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}

      {/* CTA / Result Section */}
      {!revealed ? (
        <button 
          className="btn btn-primary" 
          style={{ width: "100%" }} 
          onClick={handleCheck} 
          disabled={blanks.some(b => !(userInputs[b.index] || "").trim())}
        >
          Check Answers
        </button>
      ) : (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "#10B981" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "#10B981" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {isCorrect ? "EXCELLENT!" : "KEEP PRACTICING"}
             </p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ContentRenderer fixEscapes>{back}</ContentRenderer>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rate Difficulty</p>
             <RatingButtons onRate={handleRate} wasCorrect={isCorrect ?? false} />
          </div>
        </div>
      )}
    </div>
  );
}
