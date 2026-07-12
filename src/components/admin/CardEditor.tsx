"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Save } from "lucide-react";
import { FlashCard } from "@/components/cards/FlashCard";
import { MCQCard } from "@/components/cards/MCQCard";
import { ClozeCard } from "@/components/cards/ClozeCard";
import { NumericalEntryCard } from "@/components/cards/NumericalEntryCard";
import { MultiSelectCard } from "@/components/cards/MultiSelectCard";
import { AssertionReasonCard } from "@/components/cards/AssertionReasonCard";
import { TrueFalseJustifyCard } from "@/components/cards/TrueFalseJustifyCard";
import { ErrorSpottingCard } from "@/components/cards/ErrorSpottingCard";
import { ConceptInterleaveCard } from "@/components/cards/ConceptInterleaveCard";
import { SequencingCard } from "@/components/cards/SequencingCard";
import { MatrixMatchCard } from "@/components/cards/MatrixMatchCard";
import { ImageOcclusionCard } from "@/components/cards/ImageOcclusionCard";

interface CardEditorProps {
  initialType?: string;
  initialFront?: string;
  initialBack?: string;
  initialOptions?: string[];
  initialCorrectOption?: number;
  initialCorrectOptions?: number[];
  initialClozeTemplate?: string;
  initialWhyPrompt?: string;
  initialAdvancedMetadata?: any;
  initialTier?: "free" | "premium";
  initialTags?: string[];
  onSave: (data: CardFormData) => Promise<void>;
  isSaving?: boolean;
}

export interface CardFormData {
  type: string;
  front: string;
  back: string;
  tier: "free" | "premium";
  tags: string[];
  options?: string[];
  correctOption?: number;
  correctOptions?: number[];
  clozeTemplate?: string;
  whyPrompt?: string;
  advancedMetadata?: any;
}

const MD_OPTS = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
};

const JEE_SNIPPETS = [
  { label: "Integral", insert: "$\\int_a^b f(x)\\,dx$" },
  { label: "Vector", insert: "$\\vec{F} = m\\vec{a}$" },
  { label: "Fraction", insert: "$\\frac{a}{b}$" },
  { label: "Sum", insert: "$\\sum_{i=1}^{n}$" },
  { label: "Partial", insert: "$\\frac{\\partial f}{\\partial x}$" },
  { label: "sqrt", insert: "$\\sqrt{x}$" },
  { label: "Delta",  insert: "$\\Delta$" },
  { label: "Arrow",  insert: "$\\rightarrow$" },
];

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div style={{
      minHeight: 120, padding: "0.875rem",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      fontSize: "0.9rem", lineHeight: 1.7,
      color: content ? "var(--text-primary)" : "var(--text-muted)",
    }}>
      {content
        ? <ReactMarkdown {...MD_OPTS}>{content}</ReactMarkdown>
        : <em>Preview will appear here…</em>
      }
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function CardEditor({
  initialType = "flashcard",
  initialFront = "",
  initialBack = "",
  initialOptions = ["", "", "", ""],
  initialCorrectOption = 0,
  initialCorrectOptions = [],
  initialClozeTemplate = "",
  initialWhyPrompt = "",
  initialAdvancedMetadata = {},
  initialTier = "free",
  initialTags = [],
  onSave,
  isSaving = false,
}: CardEditorProps) {
  const [type, setType] = useState(initialType);
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [options, setOptions] = useState(initialOptions);
  const [correctOption, setCorrectOption] = useState(initialCorrectOption);
  const [correctOptions, setCorrectOptions] = useState<number[]>(initialCorrectOptions);
  const [clozeTemplate, setClozeTemplate] = useState(initialClozeTemplate);
  const [whyPrompt, setWhyPrompt] = useState(initialWhyPrompt);
  const [advancedMetadata, setAdvancedMetadata] = useState(initialAdvancedMetadata);
  const [tier, setTier] = useState<"free" | "premium">(initialTier);
  const [tagInput, setTagInput] = useState(initialTags.join(", "));
  const [preview, setPreview] = useState<"front" | "back" | "full" | "interactive">("interactive");

  const handleSave = async () => {
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await onSave({
      type, front, back, tier, tags,
      options: (type === "mcq" || type === "multi_select" || type === "sequencing") ? options : undefined,
      correctOption: type === "mcq" ? correctOption : undefined,
      correctOptions: type === "multi_select" ? correctOptions : undefined,
      clozeTemplate: type === "cloze" ? clozeTemplate : undefined,
      whyPrompt: whyPrompt || undefined,
      advancedMetadata: Object.keys(advancedMetadata).length > 0 ? advancedMetadata : undefined,
    });
  };

  const insertSnippet = (snippet: string) => {
    setFront((prev) => prev + " " + snippet);
  };

  const TYPE_META: Record<string, { label: string, desc: string, color: string, bg: string, border: string }> = {
    flashcard:          { label: "Flashcard", desc: "Retrieval Practice", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)" },
    mcq:                { label: "MCQ",       desc: "Interleaving",       color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
    cloze:              { label: "Cloze",     desc: "Generation Effect",  color: "#F472B6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)" },
    elaborative:        { label: "Elaborate", desc: "Interrogation",     color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
    numerical:          { label: "Numerical", desc: "Precise Calculation",color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
    assertion_reason:   { label: "Assert-R",  desc: "Conceptual Logic",   color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
    error_spotting:     { label: "Error Spot",desc: "Debug Logic",        color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)" },
    matrix_match:       { label: "Matrix",    desc: "Relational Mapping", color: "#EC4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)" },
    sequencing:         { label: "Sequence",  desc: "Order & Ranking",    color: "#6366F1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)" },
    concept_interleave: { label: "Link",      desc: "Knowledge Web",      color: "#14B8A6", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)" },
    image_occlusion:    { label: "Visual",    desc: "Spatial Recall",     color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
    multi_select:       { label: "Multi-Sel", desc: "Complex Eval",       color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
    true_false_justify: { label: "T/F Just",  desc: "Anti-Guessing",      color: "#06B6D4", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.3)" },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* ── Left: Editor ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Type selector */}
        <Field label="Card Type">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "0.5rem" }}>
            {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((t) => {
              const isActive = type === t;
              const meta = TYPE_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "0.75rem 0.5rem",
                    border: `2px solid ${isActive ? meta.border : "var(--border)"}`,
                    borderRadius: "12px",
                    background: isActive ? meta.bg : "transparent",
                    color: isActive ? meta.color : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textAlign: "center",
                    transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div style={{ letterSpacing: "0.02em" }}>{meta.label}</div>
                  <div style={{ fontWeight: 500, fontSize: "0.65rem", opacity: isActive ? 0.9 : 0.6, marginTop: 4 }}>{meta.desc}</div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Front */}
        <Field label="Front (Markdown + KaTeX)">
          <textarea
            className="input textarea"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="e.g. State Newton's Second Law. $\vec{F} = ?$"
            rows={4}
          />
          {/* KaTeX snippet toolbar */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {JEE_SNIPPETS.map((s) => (
              <button
                key={s.label}
                onClick={() => insertSnippet(s.insert)}
                className="action-btn"
                style={{
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.65rem", fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Back */}
        <Field label="Back / Explanation">
          <textarea
            className="input textarea"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Full answer with explanation. Markdown + KaTeX supported."
            rows={5}
          />
        </Field>

        {/* MCQ options */}
        {type === "mcq" && (
          <Field label="Options (A–D)">
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={() => setCorrectOption(i)}
                  style={{
                    width: 28, height: 28, flexShrink: 0,
                    border: `2px solid ${correctOption === i ? "var(--success)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    background: correctOption === i ? "rgba(16,185,129,0.15)" : "transparent",
                    color: correctOption === i ? "var(--success)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 700, fontSize: "0.75rem",
                  }}
                >
                  {["A","B","C","D"][i]}
                </button>
                <input
                  className="input"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${["A","B","C","D"][i]}`}
                />
              </div>
            ))}
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Click the letter to mark as correct</p>
          </Field>
        )}

        {/* Multi-Select options */}
        {type === "multi_select" && (
          <Field label="Options (Select ALL correct)">
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={() => {
                    const next = [...correctOptions];
                    if (next.includes(i)) setCorrectOptions(next.filter(v => v !== i));
                    else setCorrectOptions([...next, i]);
                  }}
                  style={{
                    width: 28, height: 28, flexShrink: 0,
                    border: `2px solid ${correctOptions.includes(i) ? "var(--success)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    background: correctOptions.includes(i) ? "rgba(16,185,129,0.15)" : "transparent",
                    color: correctOptions.includes(i) ? "var(--success)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 700, fontSize: "0.75rem",
                  }}
                >
                  {["A","B","C","D"][i]}
                </button>
                <input
                  className="input"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${["A","B","C","D"][i]}`}
                />
              </div>
            ))}
          </Field>
        )}

        {/* Numerical Answer */}
        {type === "numerical" && (
          <Field label="Target Numerical Value">
            <input
              type="number"
              className="input"
              value={advancedMetadata.numericalAnswer ?? ""}
              onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, numericalAnswer: parseFloat(e.target.value) })}
              placeholder="e.g. 9.8"
            />
          </Field>
        )}

        {/* Assertion & Reason */}
        {type === "assertion_reason" && (
          <>
            <Field label="Assertion Statement">
              <input
                className="input"
                value={advancedMetadata.assertion ?? ""}
                onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, assertion: e.target.value })}
                placeholder="A: Statement A"
              />
            </Field>
            <Field label="Reasoning Statement">
              <input
                className="input"
                value={advancedMetadata.reason ?? ""}
                onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, reason: e.target.value })}
                placeholder="R: Statement R"
              />
            </Field>
            <Field label="Correct Key (A-E)">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["A","B","C","D","E"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setAdvancedMetadata({ ...advancedMetadata, correctAssertionReasonKey: k })}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: `2px solid ${advancedMetadata.correctAssertionReasonKey === k ? "var(--accent)" : "var(--border)"}`,
                      background: advancedMetadata.correctAssertionReasonKey === k ? "var(--accent-glow)" : "transparent",
                      color: advancedMetadata.correctAssertionReasonKey === k ? "var(--accent)" : "var(--text-muted)",
                      fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Error Spotting */}
        {type === "error_spotting" && (
          <Field label="Error Line Index (0-indexed)">
            <input
              type="number"
              className="input"
              value={advancedMetadata.errorLine ?? ""}
              onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, errorLine: parseInt(e.target.value) })}
              placeholder="e.g. 2"
            />
          </Field>
        )}

        {/* Matrix Match */}
        {type === "matrix_match" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
             <Field label="Column A (comma separated)">
                <input
                  className="input"
                  value={(advancedMetadata.matrixA || []).join(", ")}
                  onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, matrixA: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="A1, A2, A3"
                />
             </Field>
             <Field label="Column B (comma separated)">
                <input
                  className="input"
                  value={(advancedMetadata.matrixB || []).join(", ")}
                  onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, matrixB: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="B1, B2, B3"
                />
             </Field>
             <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Note: Set mapping via direct JSON edit for now or wait for Visual Mapper.</p>
          </div>
        )}

        {/* True/False Justify */}
        {type === "true_false_justify" && (
          <Field label="Ideal Justification / Reasoning">
            <textarea
              className="input textarea"
              value={advancedMetadata.justification ?? ""}
              onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, justification: e.target.value })}
              placeholder="The correct reasoning for why this statement is T/F..."
              rows={3}
            />
          </Field>
        )}

        {/* Image Occlusion */}
        {type === "image_occlusion" && (
          <Field label="Image URL">
             <input
                className="input"
                value={advancedMetadata.imageUrl ?? ""}
                onChange={(e) => setAdvancedMetadata({ ...advancedMetadata, imageUrl: e.target.value })}
                placeholder="https://..."
              />
          </Field>
        )}

        {/* Cloze template */}
        {type === "cloze" && (
          <Field label='Cloze Template — use [[answer]] for the blank'>
            <input
              className="input"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
              value={clozeTemplate}
              onChange={(e) => setClozeTemplate(e.target.value)}
              placeholder='e.g. $KE = [[\\frac{1}{2}]]mv^2$'
            />
          </Field>
        )}

        {/* Why prompt */}
        <Field label='Why Prompt (optional — Elaborative Interrogation)'>
          <textarea
            className="input textarea"
            value={whyPrompt}
            onChange={(e) => setWhyPrompt(e.target.value)}
            placeholder="Why does this work? What's the deeper principle?"
            rows={3}
          />
        </Field>

        {/* Tier + Tags */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
          <Field label="Tier">
            <select
              className="input select"
              value={tier}
              onChange={(e) => setTier(e.target.value as "free" | "premium")}
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              className="input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="mechanics, newton, jee-advanced"
            />
          </Field>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving || !front.trim() || !back.trim()}
          style={{ alignSelf: "flex-start", padding: "0.75rem 2rem" }}
        >
          <Save size={16} />
          {isSaving ? "Saving…" : "Save Card"}
        </button>
      </div>

      {/* ── Right: Live Preview ───────────────────────────────── */}
      <div style={{ position: "sticky", top: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["interactive", "front", "back", "full"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreview(p)}
              className={preview === p ? "btn btn-primary" : "btn btn-ghost"}
              style={{ fontSize: "0.75rem", padding: "0.375rem 0.875rem", textTransform: "capitalize" }}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="card card-elevated" style={{ minHeight: 300, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "1rem" }}>
            Live Preview ({preview})
          </p>

          {preview === "interactive" ? (
            <div style={{ flex: 1 }}>
              {(!front.trim() || !back.trim()) ? (
                <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <em>Please enter Front and Back content to preview...</em>
                </div>
              ) : (
                <div key={`${type}-${front.length}-${back.length}-${options.join(",")}-${correctOption}-${correctOptions.join(",")}-${clozeTemplate.length}-${JSON.stringify(advancedMetadata)}`}>
                  {(type === "flashcard" || type === "elaborative") && (
                    <FlashCard front={front} back={back} whyPrompt={whyPrompt} onRate={() => {}} />
                  )}
                  {type === "mcq" && (
                    <MCQCard front={front} back={back} options={options} correctOption={correctOption} onRate={() => {}} />
                  )}
                  {type === "cloze" && (
                    <ClozeCard front={front} back={back} clozeTemplate={clozeTemplate} onRate={() => {}} />
                  )}
                  {type === "numerical" && (
                    <NumericalEntryCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "multi_select" && (
                    <MultiSelectCard front={front} back={back} options={options} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "assertion_reason" && (
                    <AssertionReasonCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "true_false_justify" && (
                    <TrueFalseJustifyCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "error_spotting" && (
                    <ErrorSpottingCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "concept_interleave" && (
                    <ConceptInterleaveCard front={front} back={back} onRate={() => {}} />
                  )}
                  {type === "sequencing" && (
                    <SequencingCard front={front} back={back} options={options} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "matrix_match" && (
                    <MatrixMatchCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                  {type === "image_occlusion" && (
                    <ImageOcclusionCard front={front} back={back} advancedMetadata={advancedMetadata} onRate={() => {}} />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {(preview === "front" || preview === "full") && (
                <div style={{ marginBottom: preview === "full" ? "1.5rem" : 0 }}>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>FRONT</p>
                  <MarkdownPreview content={front} />
                </div>
              )}

              {(preview === "back" || preview === "full") && (
                <div>
                  {preview === "full" && <div className="divider" />}
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>BACK</p>
                  <MarkdownPreview content={back} />
                </div>
              )}

              {type === "cloze" && clozeTemplate && preview !== "back" && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>CLOZE TEMPLATE</p>
                  <MarkdownPreview content={clozeTemplate.replace(/\[\[(.+?)\]\]/g, "_____")} />
                </div>
              )}

              {whyPrompt && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--accent-glow)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700, marginBottom: "0.4rem" }}>WHY PROMPT</p>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <ReactMarkdown {...MD_OPTS}>{whyPrompt}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Type badge */}
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: 700,
            background: TYPE_META[type].bg, color: TYPE_META[type].color,
            border: `1px solid ${TYPE_META[type].border}`
          }}>
            {TYPE_META[type].label}
          </span>
          <span style={{
            fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: 700,
            background: tier === "premium" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)",
            color: tier === "premium" ? "#F59E0B" : "var(--text-muted)",
            border: `1px solid ${tier === "premium" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
          }}>
            {tier === "free" ? "Free" : "Premium"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {TYPE_META[type].desc}
          </span>
        </div>
      </div>
    </div>
  );
}
