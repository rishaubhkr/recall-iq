"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Search, Plus, Trash2, Loader2, FileText, Eye, EyeOff, Layers, X, Edit } from "lucide-react";
import Link from "next/link";
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

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  flashcard:          { label: "FLA", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  mcq:                { label: "MCQ", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  cloze:              { label: "CLZ", color: "#F472B6", bg: "rgba(244,114,182,0.12)" },
  elaborative:        { label: "ELB", color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  numerical:          { label: "NUM", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  multi_select:       { label: "MUL", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  assertion_reason:   { label: "ASR", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  true_false_justify: { label: "TFJ", color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
  error_spotting:     { label: "ERR", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  concept_interleave: { label: "INT", color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
  sequencing:         { label: "SEQ", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  matrix_match:       { label: "MTX", color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
  image_occlusion:    { label: "IMG", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
};

export default function AdminCardsPage() {
  const [search, setSearch] = useState("");
  const [filterPublished, setFilterPublished] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [previewCard, setPreviewCard] = useState<any | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (previewCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [previewCard]);

  const [selectedCourseId, setSelectedCourseId] = useState<Id<"courses"> | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | undefined>(undefined);
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | undefined>(undefined);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<Id<"subtopics"> | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"cards">>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterPublished, selectedCourseId, selectedSubjectId, selectedTopicId, selectedSubtopicId]);

  const courses = useQuery(api.courses.listAllCourses);
  const subjects = useQuery(api.subjects.listSubjectsByCourse, selectedCourseId ? { courseId: selectedCourseId } : "skip");
  const topics = useQuery(api.subjects.listTopicsBySubject, selectedSubjectId ? { subjectId: selectedSubjectId } : "skip");
  const subtopics = useQuery(api.subjects.listSubtopicsByTopic, selectedTopicId ? { topicId: selectedTopicId } : "skip");

  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.cards.adminListCards,
    {
      isPublished: filterPublished,
      courseId: selectedCourseId,
      subjectId: selectedSubjectId,
      topicId: selectedTopicId,
      subtopicId: selectedSubtopicId,
    },
    { initialNumItems: 50 }
  );

  const togglePublish = useMutation(api.cards.togglePublish);
  const deleteCard    = useMutation(api.cards.deleteCard);
  const bulkPublish   = useMutation(api.cards.bulkPublish);
  const bulkDelete    = useMutation(api.cards.bulkDeleteCards);

  const isLoading = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";

  // Client-side search within the currently loaded paginated results
  const filtered = results.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || c.front.toLowerCase().includes(q) || c.tags.some((t: string) => t.toLowerCase().includes(q));
  });

  const totalPublished = results.filter((c: any) => c.isPublished).length;
  const totalDrafts    = results.filter((c: any) => !c.isPublished).length;

  const handleDelete = async (id: Id<"cards">) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    await deleteCard({ id });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c._id)));
    }
  };

  const toggleSelect = (id: Id<"cards">) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkPublish = async (isPublished: boolean) => {
    if (selectedIds.size === 0) return;
    setIsBulkActing(true);
    try {
      await bulkPublish({ ids: Array.from(selectedIds), isPublished });
      setSelectedIds(new Set());
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} cards? This cannot be undone.`)) return;
    setIsBulkActing(true);
    try {
      await bulkDelete({ ids: Array.from(selectedIds) });
      setSelectedIds(new Set());
    } finally {
      setIsBulkActing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, width: "100%", margin: "0 auto", paddingBottom: "4rem" }}>
      <style>{`
        .card-row {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--bg-elevated);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }
        .card-row:hover {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.03);
          transform: translateY(-2px) translateZ(0);
          box-shadow: 0 8px 24px -8px rgba(0,0,0,0.35);
        }
        .card-row.is-draft { opacity: 0.55; }
        .action-btn {
          background: none; border: none; cursor: pointer;
          padding: 0.4rem; border-radius: 8px;
          transition: background 0.2s, color 0.2s;
          display: flex; align-items: center;
        }
        .action-btn:hover { background: rgba(255,255,255,0.06); }
        .cards-filter-btn {
          padding: 0.45rem 1rem; border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent; cursor: pointer;
          font-size: 0.8rem; font-weight: 600;
          color: var(--text-muted); transition: all 0.2s;
        }
        .cards-filter-btn.active {
          background: var(--accent); color: #000; border-color: var(--accent);
        }
        .stat-pill {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.9rem; border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 0.8rem;
        }
      `}</style>

      {/* Header */}
      <div className="animate-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Admin CMS</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em" }}>Cards</h1>
        </div>
        <Link href="/admin/cards/new" className="btn btn-primary" style={{ borderRadius: "14px", padding: "0.6rem 1.4rem", gap: "0.5rem" }}>
          <Plus size={16} /> New Card
        </Link>
      </div>

      {/* Stats Bar */}
      {!isLoading && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          <div className="stat-pill">
            <Layers size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{results.length}</span>
            <span style={{ color: "var(--text-muted)" }}>loaded</span>
          </div>
          <div className="stat-pill">
            <Eye size={14} style={{ color: "#34D399" }} />
            <span style={{ color: "#34D399", fontWeight: 700 }}>{totalPublished}</span>
            <span style={{ color: "var(--text-muted)" }}>published</span>
          </div>
          <div className="stat-pill">
            <EyeOff size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{totalDrafts}</span>
            <span style={{ color: "var(--text-muted)" }}>drafts</span>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ background: "var(--bg-elevated)", padding: "1.25rem", borderRadius: "20px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
        
        {/* Hierarchy Selectors */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          {/* eslint-disable @typescript-eslint/no-explicit-any */}
          {[
            { label: "Course", val: selectedCourseId, set: (id: any) => { setSelectedCourseId(id); setSelectedSubjectId(undefined); setSelectedTopicId(undefined); setSelectedSubtopicId(undefined); }, data: courses },
            { label: "Subject", val: selectedSubjectId, set: (id: any) => { setSelectedSubjectId(id); setSelectedTopicId(undefined); setSelectedSubtopicId(undefined); }, data: subjects, disabled: !selectedCourseId },
            { label: "Chapter", val: selectedTopicId, set: (id: any) => { setSelectedTopicId(id); setSelectedSubtopicId(undefined); }, data: topics, disabled: !selectedSubjectId },
            { label: "Subtopic", val: selectedSubtopicId, set: (id: any) => setSelectedSubtopicId(id), data: subtopics, disabled: !selectedTopicId }
          ].map((sel, i) => (
            <div key={i}>
              <select 
                value={sel.val || ""}
                disabled={sel.disabled}
                onChange={(e) => sel.set(e.target.value ? (e.target.value as Id<any>) : undefined)}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", appearance: "none" }}
              >
                <option value="">All {sel.label}s</option>
                {sel.data?.map((item: { _id: string; name: string }) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
          ))}
          {/* eslint-enable @typescript-eslint/no-explicit-any */}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder="Search by question or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%", paddingLeft: "2.5rem", borderRadius: "10px", background: "rgba(0,0,0,0.2)", fontSize: "0.85rem", padding: "0.6rem 0.8rem 0.6rem 2.5rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {([undefined, true, false] as const).map((val) => (
              <button
                key={String(val)}
                onClick={() => setFilterPublished(val)}
                className={`cards-filter-btn${filterPublished === val ? " active" : ""}`}
              >
                {val === undefined ? "All Status" : val ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!isLoading && filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> card{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
          <button 
            onClick={handleSelectAll}
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", height: "auto", gap: "0.5rem", borderRadius: "8px" }}
          >
            <div style={{ 
              width: 16, height: 16, border: "2px solid var(--border)", borderRadius: "4px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: selectedIds.size === filtered.length && filtered.length > 0 ? "var(--accent)" : "transparent",
              borderColor: selectedIds.size === filtered.length && filtered.length > 0 ? "var(--accent)" : "var(--border)"
            }}>
              {selectedIds.size === filtered.length && filtered.length > 0 && <div style={{ width: 8, height: 2, background: "#000", borderRadius: 1 }} />}
            </div>
            {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "3rem", color: "var(--text-muted)", justifyContent: "center" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading cards…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border)", borderRadius: "24px", color: "var(--text-muted)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <FileText size={40} style={{ opacity: 0.15 }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            {search ? "No cards match your search" : "No cards yet"}
          </p>
          <p style={{ fontSize: "0.875rem" }}>
            <Link href="/admin/cards/new" style={{ color: "var(--accent)" }}>Create your first card</Link>
            {" "}or use{" "}
            <Link href="/admin/import" style={{ color: "var(--accent)" }}>Bulk Import</Link>.
          </p>
        </div>
      )}

      {/* Card rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {filtered.map((card: any) => {
          const meta = TYPE_META[card.type] ?? {
            label: card.type.slice(0, 3).toUpperCase(),
            color: "var(--text-muted)",
            bg: "var(--bg-elevated)",
          };
          return (
            <div 
              key={card._id} 
              className={`card-row${card.isPublished ? "" : " is-draft"}`}
              style={{ position: "relative" }}
            >
              {/* Checkbox Overlay/Side */}
              <div 
                onClick={() => toggleSelect(card._id)}
                style={{
                  width: 20, height: 20, cursor: "pointer", borderRadius: "6px",
                  border: `2px solid ${selectedIds.has(card._id) ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                  background: selectedIds.has(card._id) ? "var(--accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                {selectedIds.has(card._id) && <div style={{ width: 10, height: 2, background: "#000", borderRadius: 1 }} />}
              </div>

              {/* Type Badge */}
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                background: meta.bg, borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.05em",
                color: meta.color, fontFamily: "monospace",
              }}>
                {meta.label}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: 500, fontSize: "0.9rem", lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: "var(--text-primary)",
                }}>
                  {card.front}
                </p>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "6px", fontWeight: 700,
                    background: card.tier === "premium" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)",
                    color: card.tier === "premium" ? "#F59E0B" : "var(--text-muted)",
                    border: `1px solid ${card.tier === "premium" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    {card.tier}
                  </span>
                  {card.tags.slice(0, 4).map((t: string) => (
                    <span key={t} style={{
                      fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "6px",
                      background: "rgba(255,255,255,0.04)", color: "var(--text-muted)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Publish Toggle */}
              <button 
                onClick={() => togglePublish({ id: card._id })}
                title={card.isPublished ? "Click to unpublish" : "Click to publish"}
                style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.65rem",
                  borderRadius: "8px", flexShrink: 0, cursor: "pointer",
                  background: card.isPublished ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                  color: card.isPublished ? "#34D399" : "var(--text-muted)",
                  border: `1px solid ${card.isPublished ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.2s"
                }}>
                {card.isPublished ? "Live" : "Draft"}
              </button>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0, alignItems: "center" }}>
                <Link
                  href={`/admin/cards/edit?cardId=${card._id}`}
                  className="action-btn"
                  title="Edit Card"
                  style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Edit size={16} />
                </Link>
                <button
                  className="action-btn"
                  onClick={() => setPreviewCard(card)}
                  title="Preview Card"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Eye size={16} />
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleDelete(card._id)}
                  title="Delete card"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {!isLoading && status === "CanLoadMore" && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => loadMore(50)}
            disabled={isLoadingMore}
            style={{ padding: "0.8rem 2rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : "Load More Cards"}
          </button>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: "24px",
          padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1.5rem",
          boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)", zIndex: 1000,
          animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)"
        }}>
          <style>{`
            @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
          `}</style>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {selectedIds.size} Selected
          </div>
          <div className="divider-v" style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => handleBulkPublish(true)}
              disabled={isBulkActing}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "#34D399" }}
            >
              {isBulkActing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              Make Public
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={() => handleBulkPublish(false)}
              disabled={isBulkActing}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}
            >
              {isBulkActing ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />}
              Draft All
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={handleBulkDelete}
              disabled={isBulkActing}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--error)" }}
            >
              {isBulkActing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </button>
          </div>
          <button 
            className="action-btn" 
            onClick={() => setSelectedIds(new Set())}
            style={{ marginLeft: "0.5rem" }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Preview Dialog Modal */}
      {previewCard && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999, padding: "2rem"
        }} onClick={() => setPreviewCard(null)}>
          <div style={{
            position: "relative", width: "100%", maxWidth: "800px",
            background: "var(--bg-primary)",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            animation: "fadeIn 0.2s ease-out",
            overflow: "hidden" // Keeps everything, including scrollbar, within rounded corners
          }} onClick={e => e.stopPropagation()}>
            
            {/* Floating Close & Edit Buttons */}
            <div style={{ position: "absolute", top: "1.5rem", right: "2rem", display: "flex", gap: "0.5rem", zIndex: 50, alignItems: "center" }}>
              <Link 
                href={`/admin/cards/edit?cardId=${previewCard._id}`}
                className="btn btn-ghost"
                onClick={() => setPreviewCard(null)}
                style={{
                  padding: "0.35rem 0.85rem", borderRadius: "10px", fontSize: "0.75rem",
                  background: "var(--bg-elevated)", border: "1px solid var(--border)", 
                  color: "var(--accent)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem",
                  textDecoration: "none"
                }}
              >
                <Edit size={14} /> Edit Card
              </Link>
              <button 
                onClick={() => setPreviewCard(null)}
                style={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border)", 
                  color: "var(--text-primary)", cursor: "pointer",
                  padding: "0.5rem", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
              >
                <X size={18} />
              </button>
            </div>

            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
              .preview-scrollbar::-webkit-scrollbar { width: 8px; }
              .preview-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 1.5rem 0; }
              .preview-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
              .preview-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
            
            {/* Scroll Container (No padding so scrollbar is at the extreme edge) */}
            <div className="preview-scrollbar" style={{
              width: "100%", maxHeight: "85vh", overflowY: "auto",
            }}>
              {/* Inner Wrapper (Provides the generous padding) */}
              <div style={{ padding: "4rem 3.5rem 3.5rem 3.5rem" }}>
                {(previewCard.type === "flashcard" || previewCard.type === "elaborative") && (
                  <FlashCard 
                    front={previewCard.front} 
                    back={previewCard.back} 
                    whyPrompt={previewCard.whyPrompt}
                    mentalHook={previewCard.mentalHook}
                    onRate={() => {}} 
                  />
                )}
                
                {previewCard.type === "mcq" && (
                  <MCQCard 
                    front={previewCard.front} 
                    options={previewCard.options || []} 
                    correctOption={previewCard.correctOption ?? 0}
                    back={previewCard.back}
                    onRate={() => {}} 
                  />
                )}
                
                {previewCard.type === "cloze" && (
                  <ClozeCard 
                    front={previewCard.front} 
                    clozeTemplate={previewCard.clozeTemplate || ""}
                    back={previewCard.back}
                    onRate={() => {}} 
                  />
                )}

                {previewCard.type === "numerical" && (
                  <NumericalEntryCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "multi_select" && (
                  <MultiSelectCard
                    front={previewCard.front}
                    options={previewCard.options || []}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    back={previewCard.back}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "assertion_reason" && (
                  <AssertionReasonCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "true_false_justify" && (
                  <TrueFalseJustifyCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "error_spotting" && (
                  <ErrorSpottingCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "concept_interleave" && (
                  <ConceptInterleaveCard
                    front={previewCard.front}
                    back={previewCard.back}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "sequencing" && (
                  <SequencingCard
                    front={previewCard.front}
                    back={previewCard.back}
                    options={previewCard.options || []}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "matrix_match" && (
                  <MatrixMatchCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}

                {previewCard.type === "image_occlusion" && (
                  <ImageOcclusionCard
                    front={previewCard.front}
                    back={previewCard.back}
                    advancedMetadata={previewCard.advancedMetadata || {}}
                    onRate={() => {}}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
