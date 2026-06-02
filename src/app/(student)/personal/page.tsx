"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Sparkles, Copy, Plus, Folder, AlertCircle, CheckCircle, Save, Trash2, Edit2 } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

type RowData = Record<string, string>;

const VALID_TYPES = [
  "flashcard", "mcq", "cloze", "elaborative", "numerical", 
  "assertion_reason", "error_spotting", "matrix_match", 
  "sequencing", "concept_interleave", "image_occlusion", 
  "multi_select", "true_false_justify"
];

const EMPTY_ROW = (): RowData => ({
  type: "flashcard", front: "", back: "", options: "", correctOption: "",
});

function buildStudentPrompt(topic: string, quantity: number) {
  return `Act as an expert tutor. Generate highly effective cognitive science flashcards for the topic: "${topic}"

Output ONLY a TSV (Tab-Separated Values) table with the following headers:
type	front	back	options	correctOption

--- SCHEMA REFERENCE ---
1. type must be one of: [flashcard, mcq, cloze, elaborative, numerical, assertion_reason, true_false_justify]
2. ALL INDICES MUST BE 1-BASED. (Option 1 = 1).
3. If type is 'mcq', 'front' is the question, 'options' is a pipe-separated list (e.g. Mitochondria|Nucleus|Ribosome). 
   CRITICAL: Do NOT include bullet points, dots, or prefixes like "A.", "B.", "1.", "2." in the options! Just the raw text!
   'correctOption' is the 1-based index of the correct answer.
4. If type is 'cloze', use [[blank]] syntax in the front.
5. Make sure the TSV is clean with no extra text before or after.

Generate ${quantity} diverse, high-yield questions to test deep understanding.`;
}

export default function PersonalSpacePage() {
  const { user } = useUser();
  
  // Data
  const personalDecks = useQuery(api.personal.getPersonalDecks, user ? { userId: user.id } : "skip");
  const createDeck = useMutation(api.personal.createPersonalDeck);
  const commitCards = useMutation(api.personal.commitPersonalCards);

  // State
  const [view, setView] = useState<"list" | "import">("list");
  const [activeDeckId, setActiveDeckId] = useState<Id<"courses"> | "">("");
  
  const [newDeckName, setNewDeckName] = useState("");
  const [topicFocus, setTopicFocus] = useState("");
  const [cardQuantity, setCardQuantity] = useState(5);
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<RowData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const activeDeck = personalDecks?.find(d => d.course._id === activeDeckId);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDeckName.trim()) return;
    const res = await createDeck({ userId: user.id, name: newDeckName });
    setNewDeckName("");
    // Do not auto navigate to import, let them click it
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(buildStudentPrompt(topicFocus || "General Review", cardQuantity));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t")) return;
    e.preventDefault();
    
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const hasHeader = lines[0].toLowerCase().includes("type");
    const headerRow = hasHeader ? lines[0].toLowerCase().split("\t") : [];
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const defaultCols = ["type", "front", "back", "options", "correctOption"];

    const parsed: RowData[] = dataLines.map(line => {
      const cells = line.split("\t").map(c => {
        let val = c.trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        return val;
      });
      
      const row = EMPTY_ROW();
      if (hasHeader) {
        headerRow.forEach((colName, i) => {
          const rawName = colName.trim().toLowerCase();
          const mappedKey = rawName === "correctoption" ? "correctOption" : rawName;
          if (row.hasOwnProperty(mappedKey) && cells[i]) {
            row[mappedKey] = cells[i];
          }
        });
      } else {
        defaultCols.forEach((key, i) => { if(cells[i]) row[key] = cells[i]; });
      }
      return row;
    });

    setRows(parsed.filter(r => r.front || r.back));
  }, []);

  const handleSaveToDeck = async () => {
    if (!user || !activeDeck || !activeDeck.subtopicId || rows.length === 0) return;
    setIsSaving(true);
    try {
      await commitCards({
        userId: user.id,
        subtopicId: activeDeck.subtopicId,
        cards: rows.map(r => ({
          type: r.type,
          front: r.front,
          back: r.back,
          options: r.options ? r.options.split("|").map(s => s.trim()) : undefined,
          correctOption: r.correctOption ? Number(r.correctOption) - 1 : undefined,
        }))
      });
      setRows([]);
      alert("Cards saved successfully to your deck!");
      setView("list");
    } catch (err) {
      console.error(err);
      alert("Failed to save cards.");
    }
    setIsSaving(false);
  };

  const openImport = (deckId: Id<"courses">) => {
    setActiveDeckId(deckId);
    setView("import");
  };

  if (!user) return null;

  return (
    <div className="animate-in" style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 6rem" }}>
      <header style={{ marginBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-primary)" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "0.5rem", borderRadius: "12px", display: "flex" }}>
            <Sparkles className="text-accent" size={28} />
          </div>
          AI Personal Space
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontSize: "1.1rem", maxWidth: "600px", lineHeight: 1.6 }}>
          {view === "list" 
            ? "Manage your custom decks and leverage AI to instantly generate high-quality cognitive science flashcards." 
            : `Importing cards into: `}
            {view === "import" && <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{activeDeck?.course.name}</span>}
        </p>
      </header>

      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Deck Creation Form */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-lg)", padding: "2rem", display: "flex", gap: "2rem", alignItems: "center", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-primary)" }}>Create New Deck</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>Organize your personal flashcards by specific topics or subjects for targeted review.</p>
            </div>
            <form onSubmit={handleCreateDeck} style={{ display: "flex", gap: "0.75rem", flex: 1, position: "relative" }}>
              <input 
                type="text" 
                placeholder="e.g. Organic Chemistry Reactions" 
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                style={{ flex: 1, padding: "1rem 1.25rem", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", fontSize: "1rem", outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button type="submit" className="btn btn-primary" disabled={!newDeckName.trim()} style={{ padding: "0 1.5rem", fontWeight: 600, borderRadius: "var(--radius-md)", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)" }}>
                <Plus size={18} /> Create
              </button>
            </form>
          </div>

          {/* Deck Grid */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-primary)" }}>Your Decks</h3>
              {personalDecks && personalDecks.length > 0 && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>{personalDecks.length} {personalDecks.length === 1 ? 'Deck' : 'Decks'}</span>
              )}
            </div>
            
            {personalDecks === undefined ? (
              <div style={{ color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>Loading decks...</div>
            ) : personalDecks.length === 0 ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)", color: "var(--text-muted)" }}>
                <Folder size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>You haven't created any personal decks yet.</p>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Use the form above to create your first deck.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {personalDecks.map(d => (
                  <div key={d.course._id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", transition: "all 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem" }}>
                      <div style={{ padding: "0.75rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "12px", color: "var(--accent)" }}>
                        <Folder size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>{d.course.name}</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>Personal Collection</p>
                      </div>
                    </div>
                    <div style={{ marginTop: "auto" }}>
                      <button 
                        onClick={() => openImport(d.course._id)}
                        className="btn btn-ghost" 
                        style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "var(--radius-md)", fontWeight: 500 }}
                      >
                        <Plus size={16} /> Import Cards
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "import" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", alignItems: "start" }}>
          
          {/* LEFT COLUMN: Prompt Generator */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <button onClick={() => setView("list")} className="btn btn-ghost" style={{ alignSelf: "flex-start", paddingLeft: 0, fontWeight: 600, color: "var(--text-muted)", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
              ← Back to Decks
            </button>

            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-lg)", padding: "2rem", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.2)" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-primary)" }}>
                <Sparkles size={20} className="text-accent" /> Master Prompt Generator
              </h3>
              
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>What are you studying?</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kinematics Formulas" 
                  value={topicFocus}
                  onChange={(e) => setTopicFocus(e.target.value)}
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Number of questions</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={cardQuantity}
                  onChange={(e) => setCardQuantity(Number(e.target.value) || 5)}
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              <button 
                onClick={handleCopyPrompt}
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "1rem", fontWeight: 600, fontSize: "1rem", borderRadius: "var(--radius-md)", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)" }}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? "Prompt Copied!" : "Copy AI Prompt"}
              </button>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "center", lineHeight: 1.5 }}>
                Paste this prompt into ChatGPT or Claude, along with your class notes.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: TSV Staging Area */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-lg)", padding: "2rem", display: "flex", flexDirection: "column", height: "100%", minHeight: 650, boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-primary)" }}>
                <Save size={20} className="text-accent" /> Staging Area
              </h3>
              {rows.length > 0 && (
                <span style={{ fontSize: "0.8rem", background: "var(--accent)", color: "#000", padding: "2px 8px", borderRadius: "100px", fontWeight: 700 }}>
                  {rows.length} Cards
                </span>
              )}
            </div>

            {rows.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <textarea
                  placeholder="Paste the TSV output from the AI here..."
                  onPaste={handlePaste}
                  readOnly
                  style={{ 
                    flex: 1, 
                    background: "rgba(0,0,0,0.3)", 
                    border: "2px dashed rgba(255,255,255,0.1)", 
                    borderRadius: "var(--radius-md)", 
                    padding: "1.5rem",
                    color: "white",
                    resize: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead style={{ background: "rgba(255,255,255,0.05)", position: "sticky", top: 0, backdropFilter: "blur(4px)" }}>
                      <tr>
                        <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>Type</th>
                        <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>Content Preview</th>
                        <th style={{ padding: "1rem", textAlign: "left", width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "1rem", verticalAlign: "top" }}>
                            <span className="badge badge-free" style={{ opacity: 0.8 }}>{row.type}</span>
                          </td>
                          <td style={{ padding: "1rem", verticalAlign: "top", color: "var(--text-primary)" }}>
                            <div style={{ fontWeight: 600, marginBottom: "0.4rem", lineHeight: 1.4 }}>{row.front}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4 }}>{row.back || row.options}</div>
                          </td>
                          <td style={{ padding: "1rem", verticalAlign: "top", textAlign: "right" }}>
                            <button 
                              onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}
                              style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--error)", cursor: "pointer", padding: "0.5rem", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button onClick={() => setRows([])} className="btn btn-ghost" style={{ flex: 1, background: "rgba(255,255,255,0.05)", fontWeight: 600 }}>
                    Clear Draft
                  </button>
                  <button onClick={handleSaveToDeck} disabled={isSaving || !activeDeckId} className="btn btn-primary" style={{ flex: 2, padding: "1rem", fontWeight: 600, fontSize: "1rem", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)" }}>
                    {isSaving ? "Saving to Cloud..." : `Save ${rows.length} Cards to Deck`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
