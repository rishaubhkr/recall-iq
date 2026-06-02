"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, GripVertical, Loader2, Check, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface TopicTreeProps {
  courseId: Id<"courses">;
  courseName: string;
  hierarchyLabels?: { l1: string; l2: string; l3: string };
  hierarchyDepth?: 1 | 2 | 3;
}

const DEFAULT_LABELS = { l1: "Subject", l2: "Topic", l3: "Subtopic" };

const SUBJECT_COLORS = ["var(--physics)", "var(--chemistry)", "var(--maths)", "var(--success)", "var(--info)"];

// ── Inline editable name row ─────────────────────────────────────────────────
function ItemRow({ label, color, depth = 0, onAdd, onDelete, onRename, children }: {
  label: string; color?: string; depth?: number;
  onAdd?: () => void; onDelete?: () => void;
  onRename?: (name: string) => Promise<void>;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const [saving, setSaving] = useState(false);

  const commitRename = async () => {
    if (!editValue.trim() || editValue === label) { setEditing(false); return; }
    setSaving(true);
    await onRename?.(editValue.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          paddingLeft: `${0.75 + depth * 1.25}rem`,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "0.25rem",
          transition: "var(--transition)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        {children ? (
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : <div style={{ width: 14 }} />}

        {color && <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />}

        {editing ? (
          <input
            className="input"
            style={{ flex: 1, padding: "0.2rem 0.5rem", fontSize: "0.875rem", height: 28 }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
          />
        ) : (
          <span style={{ flex: 1, fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 400, fontSize: depth === 2 ? "0.8rem" : "0.875rem" }}>
            {label}
          </span>
        )}

        <GripVertical size={14} color="var(--text-muted)" style={{ cursor: "grab" }} />

        {editing ? (
          <>
            <button onClick={commitRename} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--success)", padding: "0.15rem" }}>
              {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            </button>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.15rem" }}>
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            {onRename && (
              <button onClick={() => { setEditValue(label); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.15rem" }} aria-label="Rename">
                <Pencil size={13} />
              </button>
            )}
            {onAdd && (
              <button onClick={onAdd} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: "0.15rem" }} aria-label="Add child">
                <Plus size={13} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: "0.15rem" }} aria-label="Delete">
                <Trash2 size={13} />
              </button>
            )}
          </>
        )}
      </div>
      {children && expanded && <div style={{ paddingLeft: "0.5rem" }}>{children}</div>}
    </div>
  );
}

// ── Inline "add" input row ────────────────────────────────────────────────────
function AddRow({ placeholder, onAdd, depth = 0 }: {
  placeholder: string; depth?: number;
  onAdd: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await onAdd(value.trim());
    setSaving(false);
    setValue("");
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", paddingLeft: `${0.75 + depth * 1.25}rem`, marginBottom: "0.5rem" }}>
      <input
        className="input"
        style={{ flex: 1, padding: "0.3rem 0.6rem", fontSize: "0.8rem", height: 30 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button
        className="btn btn-primary"
        style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem", height: 30 }}
        onClick={submit}
        disabled={saving || !value.trim()}
      >
        {saving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Add"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TopicTree({ courseId, courseName, hierarchyLabels, hierarchyDepth = 3 }: TopicTreeProps) {
  const tree = useQuery(api.subjects.getFullTree, { courseId });
  const labels = { ...DEFAULT_LABELS, ...hierarchyLabels };
  const depth = hierarchyDepth ?? 3;

  // Mutations
  const createSubject         = useMutation(api.subjects.createSubject);
  const createSubjectWithLeaf = useMutation(api.subjects.createSubjectWithAutoLeaf);
  const updateSubject  = useMutation(api.subjects.updateSubject);
  const deleteSubject  = useMutation(api.subjects.deleteSubject);
  const createTopic    = useMutation(api.subjects.createTopic);
  const updateTopic    = useMutation(api.subjects.updateTopic);
  const deleteTopic    = useMutation(api.subjects.deleteTopic);
  const createSubtopic = useMutation(api.subjects.createSubtopic);
  const updateSubtopic = useMutation(api.subjects.updateSubtopic);
  const deleteSubtopic = useMutation(api.subjects.deleteSubtopic);

  const [addingSubject, setAddingSubject] = useState(false);
  const [addingTopicFor, setAddingTopicFor]    = useState<Id<"subjects"> | null>(null);
  const [addingSubtopicFor, setAddingSubtopicFor] = useState<Id<"topics"> | null>(null);

  const handleAddSubject = async (name: string) => {
    const colorIdx = (tree?.length ?? 0) % SUBJECT_COLORS.length;
    const payload = {
      courseId, name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      color: SUBJECT_COLORS[colorIdx],
      order: (tree?.length ?? 0) + 1,
    };
    // depth=1: auto-create hidden topic+subtopic leaves
    if (depth === 1) {
      await createSubjectWithLeaf(payload);
    } else {
      await createSubject(payload);
    }
    setAddingSubject(false);
  };

  const handleAddTopic = async (subjectId: Id<"subjects">, name: string, count: number) => {
    await createTopic({
      subjectId, name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      order: count + 1,
    });
    setAddingTopicFor(null);
  };

  const handleAddSubtopic = async (topicId: Id<"topics">, name: string, count: number) => {
    await createSubtopic({
      topicId, name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      order: count + 1,
    });
    setAddingSubtopicFor(null);
  };

  if (tree === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "2rem", color: "var(--text-muted)" }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading {courseName} hierarchy…</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {courseName} — Content Hierarchy
        </p>
        <button className="btn btn-ghost" style={{ fontSize: "0.75rem" }} onClick={() => setAddingSubject(true)}>
          <Plus size={14} /> Add {labels.l1}
        </button>
      </div>

      {addingSubject && (
        <AddRow placeholder={`${labels.l1} name (e.g. ${labels.l1 === "Module" ? "Atomic Structure" : "Physics"})`} depth={0} onAdd={handleAddSubject} />
      )}

      {tree.length === 0 && !addingSubject && (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "0.875rem" }}>No {labels.l1.toLowerCase()}s yet. Click &quot;+ Add {labels.l1}&quot; to start building the hierarchy.</p>
        </div>
      )}

      {tree.map((subject) => (
        <ItemRow
          key={subject._id}
          label={subject.name}
          color={subject.color}
          depth={0}
          onRename={async (name) => { await updateSubject({ id: subject._id, name }); }}
          onAdd={depth >= 2 ? () => setAddingTopicFor(subject._id) : undefined}
          onDelete={async () => {
            if (confirm(`Delete "${subject.name}" and all its ${labels.l2.toLowerCase()}s?`))
              await deleteSubject({ id: subject._id });
          }}
        >
          {/* depth=1: no children shown — hidden topic/subtopic exist in DB but are invisible */}
          {depth >= 2 && (
            <>
              {addingTopicFor === subject._id && (
                <AddRow placeholder={`${labels.l2} name`} depth={1} onAdd={(name) => handleAddTopic(subject._id, name, subject.topics.length)} />
              )}
              {subject.topics
                .filter(t => t.slug !== "__default__")
                .map((topic) => (
                <ItemRow
                  key={topic._id}
                  label={topic.name}
                  depth={1}
                  onRename={async (name) => { await updateTopic({ id: topic._id, name }); }}
                  onAdd={depth >= 3 ? () => setAddingSubtopicFor(topic._id) : undefined}
                  onDelete={async () => {
                    if (confirm(`Delete "${topic.name}" and all its ${labels.l3.toLowerCase()}s?`))
                      await deleteTopic({ id: topic._id });
                  }}
                >
                  {depth >= 3 && (
                    <>
                      {addingSubtopicFor === topic._id && (
                        <AddRow placeholder={`${labels.l3} name`} depth={2} onAdd={(name) => handleAddSubtopic(topic._id, name, topic.subtopics.length)} />
                      )}
                      {topic.subtopics
                        .filter(s => s.slug !== "__default__")
                        .map((sub) => (
                        <ItemRow
                          key={sub._id}
                          label={sub.name}
                          depth={2}
                          onRename={async (name) => { await updateSubtopic({ id: sub._id, name }); }}
                          onDelete={async () => {
                            if (confirm(`Delete subtopic "${sub.name}"?`))
                              await deleteSubtopic({ id: sub._id });
                          }}
                        />
                      ))}
                    </>
                  )}
                </ItemRow>
              ))}
            </>
          )}
        </ItemRow>
      ))}
    </div>
  );
}
