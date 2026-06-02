"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { RatingButtons } from "./RatingButtons";

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
  // Lowercase, trim, remove punctuation, standardize whitespace
  const val = s.trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ");
  
  // Convert word to number if exists in our map
  return NUMBER_WORDS[val] || val;
}

function parseCloze(template: string, fallbackTemplate?: string): { prefix: string; suffix: string; answer: string; hint: string } {
  // Support [[answer]] and {{c1::answer}}
  let match = template.match(/^([\s\S]*?)(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})([\s\S]*)$/);
  
  if (match) {
    return { prefix: match[1], suffix: match[3], answer: match[2], hint: "" };
  }

  // If no match in clozeTemplate, maybe the AI put the cloze in the front, and used clozeTemplate as a hint
  if (fallbackTemplate) {
    const fallbackMatch = fallbackTemplate.match(/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/);
    if (fallbackMatch) {
      return { prefix: template, suffix: "", answer: fallbackMatch[1], hint: template };
    }
  }

  return { prefix: template, suffix: "", answer: "", hint: template };
}

export function ClozeCard({ front, clozeTemplate, back, onRate }: ClozeCardProps) {
  const { prefix, suffix, answer, hint } = parseCloze(clozeTemplate, front);
  const [userInput, setUserInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCheck = () => {
    const correct = fuzzyNormalize(userInput) === fuzzyNormalize(answer);
    setIsCorrect(correct);
    setRevealed(true);
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const autoConfidence = isCorrect ? 4 : 2;
    onRate(rating, autoConfidence);
    setUserInput("");
    setRevealed(false);
    setIsCorrect(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Context Area */}
      <div className="card" style={{ padding: "2.5rem", background: "var(--bg-elevated)", border: "4px solid #2A3C44", borderRadius: "24px" }}>
        <p style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.8rem", color: "var(--accent)", marginBottom: "1rem", letterSpacing: "0.1em" }}>Fill in the blank</p>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.5 }}>
          <ReactMarkdown {...MD_OPTS}>
            {front.replace(/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/g, "_____")}
          </ReactMarkdown>
        </div>
      </div>

      {/* Input Area */}
      <div className="card" style={{ padding: "2rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", borderRadius: "24px", border: "4px solid #37464F" }}>
        {prefix && (
          <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            <ReactMarkdown {...MD_OPTS}>{prefix}</ReactMarkdown>
          </span>
        )}
        
        {!revealed ? (
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !revealed && handleCheck()}
            autoFocus
            placeholder="..."
            style={{
              border: "3px solid var(--bg-elevated)",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "1.25rem",
              padding: "0.5rem 1rem",
              minWidth: Math.max(120, answer.length * 12),
              outline: "none",
              transition: "all 0.2s",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
            }}
          />
        ) : (
          <span style={{
            padding: "0.5rem 1rem",
            border: `3px solid ${isCorrect ? "var(--accent)" : "#FF4B4B"}`,
            borderRadius: "12px",
            background: isCorrect ? "rgba(88, 204, 2, 0.1)" : "rgba(255, 75, 75, 0.1)",
            fontFamily: "var(--font-mono)",
            color: isCorrect ? "var(--accent)" : "#FF4B4B",
            fontWeight: 600,
            fontSize: "1.25rem"
          }}>
            {answer}
          </span>
        )}

        {suffix && (
          <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            <ReactMarkdown {...MD_OPTS}>{suffix}</ReactMarkdown>
          </span>
        )}
      </div>

      {!revealed ? (
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleCheck} disabled={userInput.trim().length === 0}>
          Check Answer
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
