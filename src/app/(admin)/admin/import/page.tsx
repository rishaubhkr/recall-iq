"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { 
  CheckCircle, AlertCircle, Plus, Trash2, Sparkles, 
  Database, Settings2, X, Layers, Loader2
} from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
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

type RowData = Record<string, string>;
const EMPTY_ROW = (slug: string = ""): RowData => {
  return {
    type: "flashcard",
    front: "",
    back: "",
    options: "",
    correctOption: "",
    clozeTemplate: "",
    whyPrompt: "",
    tags: "",
    subtopicSlug: slug,
    tier: "free"
  };
};

const VALID_TYPES = [
  "flashcard", "mcq", "cloze", "elaborative", "numerical", 
  "assertion_reason", "error_spotting", "matrix_match", 
  "sequencing", "concept_interleave", "image_occlusion", 
  "multi_select", "true_false_justify"
];

function validateRow(row: RowData): string | null {
  if (!VALID_TYPES.includes(row.type)) return "Type";
  if (!row.subtopicSlug?.trim()) return "Slug";
  if (row.type !== "cloze" && !row.front?.trim()) return "Front";
  
  if (row.type === "cloze") {
    if (!row.clozeTemplate?.trim()) return "Cloze Template";
  } else if (row.type === "mcq") {
    if (!row.options?.trim()) return "Options";
    if (!row.correctOption?.trim()) return "Correct Index";
  } else if (row.type === "numerical") {
    if (!row.advancedMetadata?.trim()) return "Metadata (numericalAnswer) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (data.numericalAnswer === undefined || isNaN(Number(data.numericalAnswer))) {
        return "Metadata must contain 'numericalAnswer' (number)";
      }
    } catch (e) {
      return "Metadata must be valid JSON (e.g. {\"numericalAnswer\": 42})";
    }
  } else if (row.type === "multi_select") {
    if (!row.options?.trim()) return "Options";
    if (!row.advancedMetadata?.trim()) return "Metadata (correctOptions) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (!Array.isArray(data.correctOptions) && !Array.isArray(data.correctIndices)) {
        return "Metadata must contain 'correctOptions' array";
      }
    } catch (e) {
      return "Metadata must be valid JSON (e.g. {\"correctOptions\": [0, 2]})";
    }
  } else if (row.type === "sequencing") {
    if (!row.options?.trim()) return "Options";
    if (!row.advancedMetadata?.trim()) return "Metadata (sequenceOrder) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (!Array.isArray(data.sequenceOrder)) {
        return "Metadata must contain 'sequenceOrder' array";
      }
    } catch (e) {
      return "Metadata must be valid JSON (e.g. {\"sequenceOrder\": [2, 0, 1]})";
    }
  } else if (row.type === "assertion_reason") {
    if (!row.advancedMetadata?.trim()) return "Metadata (assertion/reason/correctAssertionReasonKey) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (!data.assertion || !data.reason || !data.correctAssertionReasonKey) {
        return "Metadata must contain assertion, reason, and correctAssertionReasonKey";
      }
    } catch (e) {
      return "Metadata must be valid JSON";
    }
  } else if (row.type === "error_spotting") {
    if (!row.advancedMetadata?.trim()) return "Metadata (errorLine) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (data.errorLine === undefined || isNaN(Number(data.errorLine))) {
        return "Metadata must contain 'errorLine' (number)";
      }
    } catch (e) {
      return "Metadata must be valid JSON";
    }
  } else if (row.type === "matrix_match") {
    if (!row.advancedMetadata?.trim()) return "Metadata (matrixA/matrixB/matrixMapping) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (!Array.isArray(data.matrixA) || !Array.isArray(data.matrixB) || !data.matrixMapping) {
        return "Metadata must contain matrixA, matrixB, and matrixMapping";
      }
    } catch (e) {
      return "Metadata must be valid JSON";
    }
  } else if (row.type === "true_false_justify") {
    if (!row.back?.trim()) return "Back";
    if (!row.advancedMetadata?.trim()) return "Metadata (justification) Missing";
    try {
      const data = JSON.parse(row.advancedMetadata);
      if (!data.justification?.trim()) {
        return "Metadata must contain 'justification'";
      }
    } catch (e) {
      return "Metadata must be valid JSON";
    }
  } else {
    // flashcard, elaborative, concept_interleave
    if (!row.back?.trim()) return "Back";
  }
  
  return null;
}

function buildPrompt(ctx: { courseName: string; subjectName: string; topicName: string; subtopicSlug: string; subtopicName: string; cardQuantity: number }) {
  return `Act as a JEE Expert. Generate high-quality retrieval cards for: ${ctx.courseName} > ${ctx.subjectName} > ${ctx.topicName} > ${ctx.subtopicName}
Output ONLY a TSV table with the following headers:
type\tfront\tback\toptions\tcorrectOption\tclozeTemplate\twhyPrompt\ttags\tsubtopicSlug\ttier\tadvancedMetadata

--- SCHEMA REFERENCE & FORMATTING RULES (CRITICAL) ---
1. type: Must be exactly one of: [flashcard, mcq, cloze, elaborative, numerical, assertion_reason, error_spotting, matrix_match, sequencing, multi_select, true_false_justify]
2. ALL INDICES MUST BE 0-BASED. (Option 1 = 0, Line 1 = 0).
3. EMPTY FIELDS (CRITICAL): If a field is not used by the card type (e.g. no options for a flashcard), you MUST output exactly the word [EMPTY]. Do NOT leave it blank or add extra tabs to align columns visually.
4. JSON in TSV: The 'advancedMetadata' field must be a valid JSON string without double-quotes wrapping the outer JSON unless escaped. Do NOT use tabs inside the JSON.
5. Formatting by type (CRITICAL: Omitted fields must be exactly [EMPTY]):
   - "flashcard": Standard Q&A. front="Question", back="Answer".
   - "cloze": Fill-in-the-blank. front=[EMPTY], back=[EMPTY], clozeTemplate="This is a {{c1::cloze template}}."
   - "mcq": front="Question", back=[EMPTY], options="Option A | Option B | Option C | Option D", correctOption="0".
   - "multi_select": front="Question", back=[EMPTY], options="Option A | Option B | Option C", advancedMetadata={"correctOptions": [0, 2]}
   - "numerical": front="Calculate value...", back=[EMPTY], advancedMetadata={"numericalAnswer": 12.27, "numericalTolerance": 0.05}
   - "assertion_reason": front="Intro...", back=[EMPTY], advancedMetadata={"assertion": "Assertion statement", "reason": "Reason statement", "correctAssertionReasonKey": "A"}.
   - "error_spotting": front="multi-line calculation using \\n for new lines", back=[EMPTY], advancedMetadata={"errorLine": 4}.
   - "matrix_match":
     * front: "Introduction statement."
     * back: [EMPTY]
     * advancedMetadata must contain exactly these keys:
       {"matrixA": ["Item A1", "Item A2"], "matrixB": ["Item B1", "Item B2"], "matrixMapping": {"0": [1], "1": [0]}}
   - "sequencing": front="Order these:", back=[EMPTY], options="Item A | Item B | Item C", advancedMetadata={"sequenceOrder": [2, 0, 1]}.
   - "true_false_justify": front="Statement...", back="True or False", advancedMetadata={"justification": "Why it is true/false"}

subtopicSlug: MUST be exactly: ${ctx.subtopicSlug}
tier: free

--- GRAPH BLOCKS (USE WHEN HELPFUL) ---
The front and back fields support two special fenced code block types that render as live visuals.
Use them to make difficult concepts instantly visual. They work alongside regular markdown and LaTeX math.

RULE: Never put tabs inside graph blocks. Use spaces only inside JSON chart specs.

6. Mermaid diagrams — use \`\`\`mermaid blocks for: process flows, concept maps, sequences, relationships.
   Supported types: flowchart, graph, sequenceDiagram, pie
   Examples:
   
   Flowchart (chemistry/biology process):
   \`\`\`mermaid
   flowchart LR
     A[Glucose] --> B[Pyruvate] --> C[Acetyl-CoA] --> D[Krebs Cycle] --> E[34 ATP]
   \`\`\`
   
   Concept map (physics relationships):
   \`\`\`mermaid
   graph TD
     A[Newton's 2nd Law F=ma] --> B[Mass ↑ → Acceleration ↓]
     A --> C[Force ↑ → Acceleration ↑]
   \`\`\`
   
   Pie chart (composition/distribution):
   \`\`\`mermaid
   pie title Cell Cycle Phases
     "G1" : 43
     "S Phase" : 35
     "G2" : 15
     "Mitosis" : 7
   \`\`\`
   
   Keep diagrams concise: max 8-10 nodes. Use Unicode for subscripts: CO₂, H₂O, x².

7. JSON data charts — use \`\`\`chart blocks for: numerical comparisons, trends, part-whole data.
   Supported types: bar, line, pie
   Schema: {"type":"bar"|"line"|"pie","title":"string","xKey":"string","yKey":"string","color":"#HEX","data":[...]}
   Note: pie type uses {"name":"...","value":number} objects. bar/line use xKey/yKey to name the axis fields.
   
   Bar chart (compare quantities across categories):
   \`\`\`chart
   {"type":"bar","title":"First Ionisation Energy (kJ/mol)","xKey":"element","yKey":"energy","color":"#F59E0B","data":[{"element":"Li","energy":520},{"element":"Na","energy":496},{"element":"K","energy":419}]}
   \`\`\`
   
   Line chart (trend / change over variable):
   \`\`\`chart
   {"type":"line","title":"Free Fall: v vs t","xKey":"t_s","yKey":"v_ms","color":"#10B981","data":[{"t_s":0,"v_ms":0},{"t_s":1,"v_ms":9.8},{"t_s":2,"v_ms":19.6},{"t_s":3,"v_ms":29.4}]}
   \`\`\`
   
   Pie chart (composition):
   \`\`\`chart
   {"type":"pie","title":"Atmosphere","data":[{"name":"N₂","value":78},{"name":"O₂","value":21},{"name":"Ar","value":1}]}
   \`\`\`

Generate ${ctx.cardQuantity} diverse cards focusing on deep conceptual mastery. Use LaTeX for math ($...$ or $$...$$). Ensure advancedMetadata is a valid JSON string without internal tabs. Include at least 1-2 graph blocks per batch where they add genuine visual clarity (e.g. reaction pathways, trend graphs, process maps).`;
}

export default function BulkImportPage() {
  const { user } = useUser();
  const createCard = useMutation(api.cards.createCard);

  const [showAIModal, setShowAIModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);
  const [cardQuantity, setCardQuantity] = useState(10);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const [selectedCourseId, setSelectedCourseId] = useState<Id<"courses"> | "">("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | "">("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<Id<"subtopics"> | "">("");

  const courses = useQuery(api.courses.listAllCourses);
  const subjects = useQuery(api.subjects.listSubjectsByCourse, selectedCourseId ? { courseId: selectedCourseId } : "skip");
  const topics = useQuery(api.subjects.listTopicsBySubject, selectedSubjectId ? { subjectId: selectedSubjectId } : "skip");
  const subtopics = useQuery(api.subjects.listSubtopicsByTopic, selectedTopicId ? { topicId: selectedTopicId } : "skip");
  const allSubtopics = useQuery(api.subjects.listAllSubtopics);

  const activeCourse = courses?.find(c => c._id === selectedCourseId);
  const activeSubject = subjects?.find(s => s._id === selectedSubjectId);
  const activeTopic = topics?.find(t => t._id === selectedTopicId);
  const activeSubtopic = subtopics?.find(s => s._id === selectedSubtopicId);

  const [rows, setRows] = useState<RowData[]>([EMPTY_ROW()]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t")) return;
    e.preventDefault();
    
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const hasHeader = lines[0].toLowerCase().includes("type");
    const headerRow = hasHeader ? lines[0].toLowerCase().split("\t") : [];
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const defaultCols = ["type", "front", "back", "options", "correctOption", "clozeTemplate", "whyPrompt", "tags", "subtopicSlug", "tier", "advancedMetadata"];

    const parsed: RowData[] = dataLines.map(line => {
      // Handle TSV with quotes (strip them)
      const cells = line.split("\t").map(c => {
        let val = c.trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val === "[EMPTY]") val = "";
        return val;
      });
      
      const row = EMPTY_ROW(activeSubtopic?.slug);
      
      if (hasHeader) {
        const ALIAS_MAP: Record<string, string> = {
          "type": "type",
          "front": "front",
          "back": "back",
          "options": "options",
          "correctoption": "correctOption",
          "correct option": "correctOption",
          "correct index": "correctOption",
          "clozetemplate": "clozeTemplate",
          "cloze template": "clozeTemplate",
          "whyprompt": "whyPrompt",
          "why prompt": "whyPrompt",
          "tags": "tags",
          "subtopicslug": "subtopicSlug",
          "subtopic slug": "subtopicSlug",
          "tier": "tier",
          "advancedmetadata": "advancedMetadata",
          "advanced metadata": "advancedMetadata",
          "metadata": "advancedMetadata"
        };

        headerRow.forEach((colName, i) => {
          const rawName = colName.trim().toLowerCase();
          const mappedKey = ALIAS_MAP[rawName];
          if (mappedKey && cells[i]) {
            row[mappedKey] = cells[i];
          }
        });
      } else {
        defaultCols.forEach((key, i) => { if(cells[i]) row[key] = cells[i]; });
      }
      return row;
    });
    setRows(prev => [...prev.filter(r => r.front || r.back), ...parsed]); // Append to existing, filtering empty
    setSelectedIndices(new Set());
  }, [activeSubtopic]);

  const handleSelectAll = () => {
    if (selectedIndices.size === rows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(rows.map((_, i) => i)));
    }
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleBulkDelete = () => {
    if (selectedIndices.size === 0) return;
    setRows(prev => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const handleBulkTier = (tier: 'free' | 'premium') => {
    setRows(prev => prev.map((r, i) => selectedIndices.has(i) ? { ...r, tier } : r));
    setSelectedIndices(new Set());
  };

  const handleImport = async () => {
    if (!user || importing) return;
    const validRows = rows.filter(r => !validateRow(r));
    if (!validRows.length) return;

    setImporting(true);
    let ok = 0;
    const errors: string[] = [];
    const slugMap = new Map(allSubtopics?.map(s => [s.slug, s._id]));

    for (const row of validRows) {
      let subtopicId = slugMap.get(row.subtopicSlug);
      
      // OPTION B: Fallback to selected subtopic if slug is unknown or clearly wrong
      if (!subtopicId && selectedSubtopicId) {
        subtopicId = selectedSubtopicId;
        console.warn(`Falling back to selected subtopic for row with unknown slug: ${row.subtopicSlug}`);
      }

      if (!subtopicId) { errors.push(`Unknown slug: ${row.subtopicSlug}`); continue; }
      try {
        await createCard({
          subtopicId,
          type: row.type as any,
          tier: row.tier === "premium" ? "premium" : "free",
          front: row.type === "cloze" && !row.front ? row.clozeTemplate : row.front,
          back: row.back,
          options: row.options ? row.options.split("|").map(s => s.trim()) : undefined,
          correctOption: row.correctOption ? Number(row.correctOption) : undefined,
          clozeTemplate: row.clozeTemplate || undefined,
          whyPrompt: row.whyPrompt || undefined,
          tags: row.tags ? row.tags.split(",").map(t => t.trim()) : [],
          advancedMetadata: row.advancedMetadata ? (() => {
            const data = JSON.parse(row.advancedMetadata);
            // Shim for correctIndices -> correctOptions
            if (data.correctIndices && !data.correctOptions) {
              data.correctOptions = data.correctIndices;
              delete data.correctIndices;
            }
            return data;
          })() : undefined,
          createdBy: user.id,
        });
        ok++;
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : "Unknown error");
      }
    }
    setImportResult({ ok, failed: errors.length, errors });
    setImporting(false);
    // Optionally clear rows that succeeded? User said "clear them easily after added"
    // For now we keep them so they can see result, but "Select All" + "Delete" works.
  };

  const [previewRow, setPreviewRow] = useState<RowData | null>(null);

  return (
    <div className="animate-in" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* --- Standard Header --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em" }}>Bulk Import</h1>
          <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Paste content from AI to generate cards instantly</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-ghost" onClick={() => setShowAIModal(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
            <Sparkles size={18} className="text-accent" style={{ marginRight: "0.5rem" }} />
            AI Prompt
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={importing || rows.filter(r => !validateRow(r)).length === 0}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "14px" }}
          >
            {importing ? <Loader2 size={18} className="animate-spin" style={{ marginRight: "0.5rem" }} /> : <Database size={18} style={{ marginRight: "0.5rem" }} />}
            Push to Database
          </button>
        </div>
      </div>

      {importResult && (
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "24px", marginBottom: "2rem", border: importResult.failed > 0 ? "1px solid var(--error)" : "1px solid var(--success)" }}>
          <h3 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: importResult.failed > 0 ? "var(--error)" : "var(--success)" }}>
            {importResult.failed > 0 ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            Import Complete: {importResult.ok} OK, {importResult.failed} Failed
          </h3>
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "10px", fontSize: "0.85rem", fontFamily: "monospace", color: "var(--error)" }}>
              {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* --- Context Setup Card --- */}
      <div className="glass-card" style={{ padding: "2rem", borderRadius: "24px", marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={18} className="text-accent" /> Hierarchy Setup
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Course", val: selectedCourseId, set: setSelectedCourseId, data: courses },
            { label: "Subject", val: selectedSubjectId, set: setSelectedSubjectId, data: subjects, disabled: !selectedCourseId },
            { label: "Chapter", val: selectedTopicId, set: setSelectedTopicId, data: topics, disabled: !selectedSubjectId },
            { label: "Subtopic", val: selectedSubtopicId, set: setSelectedSubtopicId, data: subtopics, disabled: !selectedTopicId }
          ].map((sel, i) => (
            <div key={i}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>{sel.label}</label>
              <select 
                value={sel.val}
                disabled={sel.disabled}
                onChange={(e) => {
                  const id = e.target.value;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  sel.set(id as any);
                  if (sel.label === "Subtopic") {
                    const sub = subtopics?.find(s => s._id === id);
                    if (sub?.slug) setRows(prev => prev.map(r => r.subtopicSlug ? r : { ...r, subtopicSlug: sub.slug }));
                  }
                }}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "0.75rem", appearance: "none" }}
              >
                <option value="">Select {sel.label}</option>
                {sel.data?.map((item: { _id: string; name: string }) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* --- Editor Grid Card --- */}
      <div className="glass-card" style={{ padding: "2rem", borderRadius: "24px" }} onPaste={handlePaste}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings2 size={18} className="text-accent" /> Active Batch
          </h3>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
            <span style={{ color: "var(--success)" }}>{rows.filter(r => !validateRow(r)).length} Ready</span> / {rows.length} Total
          </div>
        </div>

        <div style={{ overflowX: "auto", paddingBottom: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem", minWidth: "800px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "1rem 0.5rem", width: "40px", textAlign: "center" }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIndices.size === rows.length && rows.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
                <th style={{ padding: "1rem 0.5rem", fontWeight: 600, width: "140px" }}>Type</th>
                <th style={{ padding: "1rem 0.5rem", fontWeight: 600 }}>Front</th>
                <th style={{ padding: "1rem 0.5rem", fontWeight: 600 }}>Back</th>
                <th style={{ padding: "1rem 0.5rem", fontWeight: 600, width: "150px" }}>Tags</th>
                <th style={{ padding: "1rem 0.5rem", fontWeight: 600, width: "100px" }}>Access</th>
                <th style={{ padding: "1rem 0.5rem", width: "100px", textAlign: "center" }}>Preview</th>
                <th style={{ padding: "1rem 0.5rem", width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const error = validateRow(row);
                const isCloze = row.type === "cloze";
                const isMcq = row.type === "mcq";

                const isSelected = selectedIndices.has(idx);

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: isSelected ? "rgba(245, 158, 11, 0.03)" : "transparent" }}>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                      {error ? <AlertCircle size={14} color="var(--error)" title={error} /> : <CheckCircle size={14} color="var(--success)" />}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      <select 
                        value={row.type}
                        onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, type: e.target.value } : r))}
                        className="input"
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem" }}
                      >
                        {VALID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      {isCloze ? (
                        <textarea 
                          value={row.clozeTemplate}
                          onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, clozeTemplate: e.target.value } : r))}
                          className="input"
                          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem", minHeight: "80px", resize: "vertical", border: "1px solid var(--accent)" }}
                          placeholder="Cloze Template (e.g. {{c1::Answer}} is...)"
                        />
                      ) : (
                        <textarea 
                          value={row.front}
                          onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, front: e.target.value } : r))}
                          className="input"
                          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem", minHeight: "60px", resize: "vertical" }}
                          placeholder="Question content..."
                        />
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      {isCloze ? (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "0.5rem", background: "rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                          Cloze cards use the template field for both sides.
                        </div>
                      ) : isMcq ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <input 
                            value={row.options}
                            onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, options: e.target.value } : r))}
                            className="input"
                            style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem" }}
                            placeholder="Opt1 | Opt2 | Opt3"
                          />
                          <input 
                            type="number"
                            value={row.correctOption}
                            onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, correctOption: e.target.value } : r))}
                            className="input"
                            style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem" }}
                            placeholder="Correct index (0-3)"
                          />
                        </div>
                      ) : (
                        <textarea 
                          value={row.back}
                          onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, back: e.target.value } : r))}
                          className="input"
                          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem", minHeight: "60px", resize: "vertical" }}
                          placeholder="Answer content..."
                        />
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      <input 
                        value={row.tags}
                        onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, tags: e.target.value } : r))}
                        className="input"
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", fontSize: "0.85rem" }}
                        placeholder="tag1, tag2"
                      />
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                      <button 
                        onClick={() => setRows(prev => prev.map((r, i) => i === idx ? { ...r, tier: r.tier === 'free' ? 'premium' : 'free' } : r))}
                        className={`btn ${row.tier === 'premium' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", borderRadius: "8px", border: row.tier === 'premium' ? 'none' : '1px solid var(--border)' }}
                      >
                        {row.tier}
                      </button>
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                      <button 
                        onClick={() => setPreviewRow(row)}
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem", borderRadius: "8px" }}
                      >
                        <Sparkles size={16} className="text-accent" />
                      </button>
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                      <button 
                        onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", opacity: 0.7 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          <button 
            onClick={() => {
              setRows(prev => [...prev, EMPTY_ROW(activeSubtopic?.slug)]);
              setSelectedIndices(new Set());
            }}
            className="btn btn-ghost"
            style={{ fontSize: "0.85rem", borderRadius: "10px", border: "1px dashed var(--border)", flex: 1 }}
          >
            <Plus size={16} style={{ marginRight: "0.5rem" }} /> Add Another Row
          </button>
          
          {selectedIndices.size > 0 && (
            <div className="animate-in" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0 1rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", marginRight: "0.5rem" }}>{selectedIndices.size} Selected</span>
              <button onClick={() => handleBulkTier('free')} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.7rem" }}>Make Free</button>
              <button onClick={() => handleBulkTier('premium')} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.7rem" }}>Make Premium</button>
              <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 0.25rem" }} />
              <button onClick={handleBulkDelete} className="btn btn-ghost" style={{ padding: "0.4rem", color: "var(--error)" }}>
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- AI Prompt Modal --- */}
      {showAIModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "700px", padding: "3rem", borderRadius: "32px", position: "relative", background: "var(--bg-elevated)" }}>
            <button 
              onClick={() => setShowAIModal(false)}
              style={{ position: "absolute", top: "2rem", right: "2rem", background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, marginBottom: "0.5rem" }}>Master Prompt</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Copy this context to ChatGPT or Claude to generate TSV data.</p>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>Quantity of Cards</label>
              <input 
                type="number" 
                value={cardQuantity}
                onChange={(e) => setCardQuantity(Number(e.target.value))}
                min={1}
                max={50}
                className="input"
                style={{ width: "100px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "0.75rem" }}
              />
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)", fontFamily: "monospace", color: "var(--accent)", fontSize: "0.85rem", whiteSpace: "pre-wrap", marginBottom: "2rem", maxHeight: "400px", overflowY: "auto" }}>
              {buildPrompt({
                courseName: activeCourse?.name ?? "...",
                subjectName: activeSubject?.name ?? "...",
                topicName: activeTopic?.name ?? "...",
                subtopicName: activeSubtopic?.name ?? "...",
                subtopicSlug: activeSubtopic?.slug ?? "slug",
                cardQuantity
              })}
            </div>
            
            <button 
              className="btn btn-primary"
              style={{ width: "100%", padding: "1rem", borderRadius: "16px", fontSize: "1rem", fontWeight: 700 }}
              onClick={() => {
                navigator.clipboard.writeText(buildPrompt({
                  courseName: activeCourse?.name ?? "...",
                  subjectName: activeSubject?.name ?? "...",
                  topicName: activeTopic?.name ?? "...",
                  subtopicName: activeSubtopic?.name ?? "...",
                  subtopicSlug: activeSubtopic?.slug ?? "slug",
                  cardQuantity
                }));
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
      {/* --- Card Row Preview Modal --- */}
      {previewRow && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "800px", padding: "3rem", borderRadius: "32px", position: "relative", display: "flex", flexDirection: "column", gap: "2rem", maxHeight: "90vh", overflowY: "auto", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em" }}>Row Preview</h2>
              <button 
                onClick={() => setPreviewRow(null)}
                style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", cursor: "pointer", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              {previewRow.type === "flashcard" && (
                <FlashCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  whyPrompt={previewRow.whyPrompt || undefined} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "mcq" && (
                <MCQCard 
                  front={previewRow.front} 
                  options={previewRow.options ? previewRow.options.split("|").map(s => s.trim()) : []} 
                  correctOption={previewRow.correctOption ? Number(previewRow.correctOption) : 0} 
                  back={previewRow.back} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "cloze" && (
                <ClozeCard 
                  front={previewRow.front || previewRow.clozeTemplate} 
                  clozeTemplate={previewRow.clozeTemplate} 
                  back={previewRow.back} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "numerical" && (
                <NumericalEntryCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "multi_select" && (
                <MultiSelectCard 
                  front={previewRow.front} 
                  options={previewRow.options ? previewRow.options.split("|").map(s => s.trim()) : []} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  back={previewRow.back} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "assertion_reason" && (
                <AssertionReasonCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "true_false_justify" && (
                <TrueFalseJustifyCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "error_spotting" && (
                <ErrorSpottingCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "concept_interleave" && (
                <ConceptInterleaveCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "sequencing" && (
                <SequencingCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  options={previewRow.options ? previewRow.options.split("|").map(s => s.trim()) : []} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "matrix_match" && (
                <MatrixMatchCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
              {previewRow.type === "image_occlusion" && (
                <ImageOcclusionCard 
                  front={previewRow.front} 
                  back={previewRow.back} 
                  advancedMetadata={previewRow.advancedMetadata ? JSON.parse(previewRow.advancedMetadata) : {}} 
                  onRate={() => {}} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
