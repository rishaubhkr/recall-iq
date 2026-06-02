"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { RatingButtons } from "./RatingButtons";
import { HelpCircle, Sparkles } from "lucide-react";

interface ClozeCardProps {
  front: string;
  clozeTemplate: string;
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4, confidence: number) => void;
}

const MD_OPTS = { 
  remarkPlugins: [remarkMath], 
  rehypePlugins: [rehypeKatex],
  components: {
    p: ({ children }: any) => <>{children}</>
  }
};

const NUMBER_WORDS: Record<string, string> = {
  "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
  "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
};

function fuzzyNormalize(s: string): string {
  let val = s.trim().toLowerCase();
  
  // Standardize square root representations
  val = val.replace(/(?:\\sqrt\s*\{|\\sqrt\s*|√|sqrt\(|root\(|root)/g, "root");
  
  // Standardize pi
  val = val.replace(/(?:\\pi|π)/g, "pi");
  
  // Standardize theta
  val = val.replace(/(?:\\theta|θ)/g, "theta");
  
  // Remove spaces, backslashes, braces, parentheses, and punctuation
  val = val.replace(/[\s\\{}()$.,\/#!%\^&\*;:_`~-]/g, "");
  
  // Convert word to number if exists in our map
  return NUMBER_WORDS[val] || val;
}

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
    let allCorrect = true;
    
    blanks.forEach(b => {
      const isBlankCorrect = fuzzyNormalize(userInputs[b.index] || "") === fuzzyNormalize(b.answer);
      correctMap[b.index] = isBlankCorrect;
      if (!isBlankCorrect) allCorrect = false;
    });
    
    setIsCorrectMap(correctMap);
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
          <ReactMarkdown {...MD_OPTS}>
            {front.replace(/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/g, "_____")}
          </ReactMarkdown>
        </div>
      </div>

      {/* Input Inline Area */}
      <div className="card" style={{ 
        padding: "2rem", 
        display: "flex", 
        flexWrap: "wrap", 
        alignItems: "center", 
        gap: "0.75rem", 
        borderRadius: "24px", 
        border: "4px solid #37464F",
        lineHeight: 1.8
      }}>
        {tokens.map((token, idx) => {
          if (token.type === "text") {
            return (
              <span key={idx} style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                <ReactMarkdown {...MD_OPTS}>{token.content}</ReactMarkdown>
              </span>
            );
          } else {
            const bIdx = token.blankIndex!;
            const isBlankRevealed = revealed;
            const isBlankCorrect = isCorrectMap[bIdx];
            
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
                      padding: "0.4rem 0.8rem",
                      minWidth: Math.max(110, token.content.length * 12),
                      outline: "none",
                      transition: "all 0.2s",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                ) : (
                  <span style={{
                    padding: "0.4rem 0.8rem",
                    border: `3px solid ${isBlankCorrect ? "var(--accent)" : "#FF4B4B"}`,
                    borderRadius: "12px",
                    background: isBlankCorrect ? "rgba(88, 204, 2, 0.1)" : "rgba(255, 75, 75, 0.1)",
                    fontFamily: "var(--font-mono)",
                    color: isBlankCorrect ? "var(--accent)" : "#FF4B4B",
                    fontWeight: 600,
                    fontSize: "1.25rem"
                  }}>
                    {token.content}
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
          <div className="card" style={{ background: "var(--bg-elevated)", padding: "2rem", borderRadius: "24px", borderLeft: `8px solid ${isCorrect ? "var(--accent)" : "#FF4B4B"}` }}>
             <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", color: isCorrect ? "var(--accent)" : "#FF4B4B", marginBottom: "0.5rem" }}>
                {isCorrect ? "EXCELLENT!" : "KEEP PRACTICING"}
             </p>
             <div style={{ color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
               <ReactMarkdown {...MD_OPTS}>{back.replace(/\\n/g, '\n')}</ReactMarkdown>
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
