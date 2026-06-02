"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { TopicTree } from "@/components/admin/TopicTree";
import { Plus, Loader2 } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function AdminSubjectsPage() {
  const exams      = useQuery(api.subjects.listExams);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeExam = exams?.[activeIdx] ?? exams?.[0]; // safeguard

  const createExam = useMutation(api.subjects.createExam);
  const updateExam = useMutation(api.subjects.updateExam);
  const deleteExam = useMutation(api.subjects.deleteExam);

  const [addingExam, setAddingExam] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editExamName, setEditExamName] = useState("");

  const handleAddExam = async () => {
    if (!newExamName.trim()) return;
    await createExam({
      name: newExamName.trim(),
      slug: newExamName.trim().toLowerCase().replace(/\s+/g, "-"),
      order: (exams?.length ?? 0) + 1,
    });
    setNewExamName("");
    setAddingExam(false);
  };

  const handleEditExam = async () => {
    if (!editExamName.trim() || !editingExamId) return;
    await updateExam({ id: editingExamId as Id<"exams">, name: editExamName.trim() });
    setEditingExamId(null);
  };

  const handleDeleteExam = async (id: Id<"exams">) => {
    if (!confirm("Are you sure you want to delete this Entire Exam and ALL its contents?")) return;
    await deleteExam({ id });
    setActiveIdx(0);
  };

  return (
    <div style={{ maxWidth: 760, width: "100%", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }} className="animate-in">
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Admin</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em" }}>Subjects & Topics</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Manage the exam → subject → topic → subtopic hierarchy.
        </p>
      </div>

      {/* Exam tabs (live from Convex) */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {exams === undefined && (
          <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
        )}

        {exams?.map((exam, i) => {
          const isActive = i === activeIdx;
          if (editingExamId === exam._id) {
            return (
              <div key={exam._id} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <input
                  className="input"
                  style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", width: 120 }}
                  value={editExamName}
                  onChange={(e) => setEditExamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditExam()}
                  autoFocus
                />
                <button className="btn btn-primary" style={{ padding: "0.4rem 0.5rem" }} onClick={handleEditExam}>Save</button>
                <button className="btn btn-ghost" style={{ padding: "0.4rem 0.5rem" }} onClick={() => setEditingExamId(null)}>Cancel</button>
              </div>
            );
          }
          return (
            <div key={exam._id} style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
              <button
                onClick={() => setActiveIdx(i)}
                className={isActive ? "btn btn-primary" : "btn btn-ghost"}
                style={{ fontSize: "0.8rem" }}
              >
                {exam.name}
              </button>
              {isActive && (
                <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button 
                    onClick={() => { setEditExamName(exam.name); setEditingExamId(exam._id); }} 
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", padding: "0.3rem 0.4rem", cursor: "pointer" }}
                    title="Edit Exam Name"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteExam(exam._id)}
                    style={{ background: "transparent", color: "var(--error)", border: "none", borderLeft: "1px solid var(--border)", padding: "0.3rem 0.4rem", cursor: "pointer" }}
                    title="Delete Exam"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add exam */}
        {addingExam ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className="input"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", width: 160 }}
              placeholder="Exam name (e.g. NEET)"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddExam()}
              autoFocus
            />
            <button className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }} onClick={handleAddExam}>
              Add
            </button>
            <button className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }} onClick={() => setAddingExam(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.78rem" }}
            onClick={() => setAddingExam(true)}
          >
            <Plus size={14} /> Add Exam
          </button>
        )}
      </div>

      {/* TopicTree for the active exam */}
      {activeExam ? (
        <TopicTree examId={activeExam._id} examName={activeExam.name} />
      ) : (
        exams !== undefined && (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600 }}>No exams yet</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Click &quot;+ Add Exam&quot; above to create your first exam (e.g. JEE Mains).</p>
          </div>
        )
      )}
    </div>
  );
}
