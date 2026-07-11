"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Plus, Check, Loader2, BookOpen, Settings, Save, ChevronLeft, Layers, Search, Users, Calendar, Box, Trash2 } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { TopicTree } from "@/components/admin/TopicTree";

export default function AdminCoursesPage() {
  const courses = useQuery(api.courses.listAllCourses);
  const createCourse = useMutation(api.courses.createCourse);

  const [isCreating, setIsCreating] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseSlug, setNewCourseSlug] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const [activeCourseId, setActiveCourseId] = useState<Id<"courses"> | null>(null);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseSlug.trim()) return;
    const id = await createCourse({
      name: newCourseName.trim(),
      slug: newCourseSlug.trim(),
      priceTier: "free",
      isPublished: false,
      order: (courses?.length ?? 0) + 1,
    });
    setNewCourseName("");
    setNewCourseSlug("");
    setIsCreating(false);
    setActiveCourseId(id);
  };

  if (activeCourseId) {
    return <CourseDetailView courseId={activeCourseId} onBack={() => setActiveCourseId(null)} />;
  }

  const filteredCourses = (courses ?? []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : filter === "published" ? c.isPublished : !c.isPublished;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in" style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: "4rem" }}>
      <style>{`
        .course-card {
          background: var(--bg-elevated);
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
          transform: translateZ(0);
          min-height: 220px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.04);
        }
        .course-card:hover {
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.6);
          transform: translateY(-3px) translateZ(0);
        }
        .course-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .badge-published {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.6rem; font-weight: 700; padding: 0.25rem 0.6rem;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.08em;
          background: rgba(16,185,129,0.12); color: #10b981;
          border: 1px solid rgba(16,185,129,0.25);
        }
        .badge-draft {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.6rem; font-weight: 700; padding: 0.25rem 0.6rem;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.08em;
          background: transparent; color: var(--text-muted);
          border: 1px dashed rgba(255,255,255,0.18);
        }
        /* outline-only: doesn't compete with amber CTA (60-30-10 rule) */
        .badge-premium {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.6rem; font-weight: 700; padding: 0.22rem 0.55rem;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.08em;
          background: transparent; color: var(--accent);
          border: 1px solid rgba(245,158,11,0.4);
        }
        .configure-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.8rem; font-weight: 700;
          padding: 0.55rem 1rem; min-height: 38px;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.25);
          background: transparent; color: #E2E8F0;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }
        .configure-btn:hover {
          border-color: var(--accent);
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -2px rgba(245, 158, 11, 0.2);
        }
        .filter-tab {
          font-size: 0.82rem; font-weight: 600;
          padding: 0.5rem 1.125rem; min-height: 40px;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06); color: #CBD5E1;
          cursor: pointer; text-transform: capitalize;
          transition: all 0.2s;
        }
        .filter-tab:hover { border-color: rgba(255,255,255,0.3); color: #FFF; background: rgba(255,255,255,0.1); }
        .filter-tab.active {
          background: var(--accent); color: #000;
          border-color: var(--accent); font-weight: 700;
          box-shadow: 0 4px 14px -4px var(--accent-glow);
        }
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .courses-grid { grid-template-columns: 1fr; }
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
            Admin CMS
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}>
            Course Manager
          </h1>
          <p style={{ color: "#94A3B8", fontWeight: 500, marginTop: "0.5rem", fontSize: "0.95rem", opacity: 1 }}>
            Create and manage learning courses and content hierarchy
          </p>
        </div>
        {/* Only amber-filled element on page — 60-30-10 rule */}
        <button
          className="btn btn-primary"
          onClick={() => setIsCreating(true)}
          aria-label="Create a new course"
          style={{ padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, minHeight: "48px", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
        >
          <Plus size={18} aria-hidden="true" />
          New Course
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <form onSubmit={handleCreateCourse} className="glass-card animate-in" style={{ padding: "1.5rem", marginBottom: "2rem", borderRadius: "20px" }}>
          <h2 style={{ marginBottom: "1rem", fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={16} aria-hidden="true" style={{ color: "var(--accent)" }} /> Create New Course
          </h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label htmlFor="course-name" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Course Name</label>
              <input
                id="course-name"
                type="text"
                placeholder="e.g. Physics Pro 2027…"
                value={newCourseName}
                autoComplete="off"
                onChange={(e) => {
                  setNewCourseName(e.target.value);
                  setNewCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
                }}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)", minHeight: "48px" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label htmlFor="course-slug" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>URL Slug</label>
              <input
                id="course-slug"
                type="text"
                placeholder="url-slug…"
                value={newCourseSlug}
                autoComplete="off"
                onChange={(e) => setNewCourseSlug(e.target.value)}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)", minHeight: "48px", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", height: "48px", borderRadius: "10px" }}>Create</button>
              <button type="button" className="btn btn-ghost" onClick={() => setIsCreating(false)} style={{ height: "48px", borderRadius: "10px" }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Toolbar */}
      {!isCreating && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <label htmlFor="course-search" className="sr-only">Search courses</label>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} aria-hidden="true" />
            <input
              id="course-search"
              type="search"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", minHeight: "40px", paddingLeft: "42px", paddingRight: "64px", color: "var(--text-primary)" }}
            />
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "6px", background: "rgba(255,255,255,0.08)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none" }}>⌘K</span>
          </div>
          <div role="group" aria-label="Filter courses" style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-tab${filter === f ? " active" : ""}`}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      {courses === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
          <Loader2 aria-label="Loading courses…" className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <article
              key={course._id}
              className="course-card"
              role="button"
              tabIndex={0}
              aria-label={`Configure ${course.name} course`}
              onClick={() => setActiveCourseId(course._id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveCourseId(course._id)}
            >
              {/* Status + Premium badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span className={course.isPublished ? "badge-published" : "badge-draft"}>
                  <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: course.isPublished ? "#10b981" : "rgba(255,255,255,0.3)", display: "inline-block" }} />
                  {course.isPublished ? "Published" : "Draft"}
                </span>
                {course.priceTier === "premium" && (
                  <span className="badge-premium" aria-label="Premium tier">✦ Premium</span>
                )}
              </div>

              {/* Course name + slug */}
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                  marginBottom: "0.375rem",
                  lineHeight: 1.25,
                }}>
                  {course.name}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#94A3B8", fontFamily: "var(--font-mono)", opacity: 1, fontWeight: 500 }}>
                  /{course.slug}
                </p>
              </div>

              {/* Real-time stats & metadata with subtle top border divider */}
              <div style={{
                borderTop: "1px solid #1E293B",
                margin: "1.25rem 0 0",
                paddingTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem"
              }}>
                <CourseCardStats courseId={course._id} creationTime={course._creationTime} />

                {/* Configure button - ghost style border-only, right-aligned with generous padding */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                  <button
                    className="configure-btn"
                    aria-label={`Configure ${course.name}`}
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); setActiveCourseId(course._id); }}
                  >
                    <Settings size={14} aria-hidden="true" />
                    Configure
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredCourses.length === 0 && (
            <div style={{
              gridColumn: "1 / -1",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "5rem 2rem",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: "24px",
              color: "var(--text-muted)",
              gap: "1rem",
              textAlign: "center"
            }}>
              <Layers size={40} aria-hidden="true" style={{ opacity: 0.15 }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-secondary)" }}>No courses found</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.375rem", opacity: 0.65 }}>
                  {search ? `No results for "${search}" — try a different term` : "Create your first course to get started"}
                </p>
              </div>
              {!search && (
                <button className="btn btn-primary" onClick={() => setIsCreating(true)} style={{ marginTop: "0.5rem", minHeight: "44px" }}>
                  <Plus size={16} aria-hidden="true" style={{ marginRight: "0.4rem" }} /> New Course
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card Stats Subcomponent ──────────────────────────────────────────

function CourseCardStats({ courseId, creationTime }: { courseId: Id<"courses">, creationTime: number }) {
  const stats = useQuery(api.courses.getCourseStats, { courseId });
  const formattedDate = new Date(creationTime).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.25rem",
      fontSize: "0.82rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#F8FAFC", whiteSpace: "nowrap" }}>
        <span role="img" aria-label="Modules" style={{ fontSize: "0.95rem" }}>📦</span>
        <span><strong style={{ fontWeight: 700 }}>{stats ? stats.moduleCount : "0"}</strong> {stats && stats.moduleCount === 1 ? "Module" : "Modules"} / <strong style={{ fontWeight: 700 }}>{stats ? stats.cardCount : "0"}</strong> {stats && stats.cardCount === 1 ? "Card" : "Cards"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#F8FAFC", whiteSpace: "nowrap" }}>
        <span role="img" aria-label="Students" style={{ fontSize: "0.95rem" }}>👤</span>
        <span><strong style={{ fontWeight: 700 }}>{stats ? stats.studentCount : "0"}</strong> {stats && stats.studentCount === 1 ? "Student" : "Students"}</span>
      </div>
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.45rem", color: "#CBD5E1", paddingTop: "0.25rem", fontSize: "0.78rem", fontWeight: 500 }}>
        <Calendar size={13} style={{ opacity: 0.9, flexShrink: 0, color: "#94A3B8" }} />
        <span>Last updated {formattedDate}</span>
      </div>
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────────────

function CourseDetailView({ courseId, onBack }: { courseId: Id<"courses">, onBack: () => void }) {
  const course = useQuery(api.courses.getCourse, { courseId });
  const updateCourse = useMutation(api.courses.updateCourse);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  const [isDeleting, setIsDeleting] = useState(false);

  const [desc, setDesc] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"general" | "content">("general");
  const [labels, setLabels] = useState<{ l1: string; l2: string; l3: string } | undefined>(undefined);

  if (course === undefined) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Loader2 className="animate-spin text-muted" /></div>;
  }

  if (course === null) {
    return <div>Course not found.</div>;
  }

  if (desc === undefined) setDesc(course.description || "");
  if (labels === undefined) setLabels(course.hierarchyLabels ?? { l1: "Subject", l2: "Topic", l3: "Subtopic" });

  const effectiveLabels = labels ?? { l1: "Subject", l2: "Topic", l3: "Subtopic" };
  const effectiveDepth = (course.hierarchyDepth ?? 3) as 1 | 2 | 3;

  const handleSaveDesc = async () => {
    await updateCourse({ id: course._id, description: desc });
  };

  const handleSaveLabels = async () => {
    await updateCourse({ id: course._id, hierarchyLabels: effectiveLabels });
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete this course? This will permanently delete ALL subjects, topics, subtopics, and cards associated with it. This action CANNOT be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCourse({ id: course._id });
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to delete course.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: "0.5rem 1rem", borderRadius: "12px" }}>
          <ChevronLeft size={16} style={{ marginRight: "0.5rem" }} /> Back
        </button>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ 
            fontSize: "0.8rem", 
            fontWeight: 600, 
            color: course.isPublished ? "#10B981" : "#F59E0B", 
            background: course.isPublished ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
            border: `1px solid ${course.isPublished ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            padding: "0.35rem 0.85rem", 
            borderRadius: "100px" 
          }}>
            {course.isPublished ? "Publicly Visible" : "Draft Mode"}
          </span>
          <button
            className="btn"
            onClick={async () => {
               await updateCourse({ id: course._id, description: desc, hierarchyLabels: effectiveLabels });
            }}
            disabled={desc === course.description && JSON.stringify(effectiveLabels) === JSON.stringify(course.hierarchyLabels ?? { l1: "Subject", l2: "Topic", l3: "Subtopic" })}
            style={{ 
              borderRadius: "12px", 
              background: "#334155", 
              color: "#F8FAFC", 
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Save size={15} /> Save Settings
          </button>
          <button
            className={`btn ${course.isPublished ? "btn-ghost" : "btn-primary"}`}
            onClick={() => updateCourse({ id: course._id, isPublished: !course.isPublished })}
            style={{ borderRadius: "12px", border: course.isPublished ? "1px solid var(--border)" : "none" }}
          >
            {course.isPublished ? "Unpublish" : "Publish Course"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {course.name}
        </h1>
        <p style={{ color: "#94A3B8", marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 500 }}>
          ID: {course._id.substring(0, 12)}… • /{course.slug}
        </p>
      </div>

      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("general")}
          style={{
            padding: "0.75rem 0.5rem", background: "none", border: "none", cursor: "pointer",
            color: activeTab === "general" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700, fontSize: "1rem", position: "relative", transition: "all 0.3s"
          }}
        >
          General Settings
          {activeTab === "general" && <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 2, background: "var(--accent)", borderRadius: "2px" }} />}
        </button>
        <button
          onClick={() => setActiveTab("content")}
          style={{
            padding: "0.75rem 0.5rem", background: "none", border: "none", cursor: "pointer",
            color: activeTab === "content" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700, fontSize: "1rem", position: "relative", transition: "all 0.3s"
          }}
        >
          Content Hierarchy
          {activeTab === "content" && <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 2, background: "var(--accent)", borderRadius: "2px" }} />}
        </button>
      </div>

      {activeTab === "general" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "24px" }}>
            <div style={{ marginBottom: "2rem" }}>
              <label htmlFor="course-desc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
              <textarea
                id="course-desc"
                className="input"
                style={{ width: "100%", minHeight: "160px", resize: "vertical", background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "1rem", fontSize: "0.95rem", lineHeight: 1.6 }}
                value={desc || ""}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Write a compelling overview for your students..."
              />
              <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hierarchy Labels</label>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                  Customize how your content levels are called. E.g. use <strong>Module / Lesson / Section</strong> instead of Subject / Topic / Subtopic.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  {(["l1", "l2", "l3"] as const).map((key, i) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>Level {i + 1}</label>
                      <input
                        type="text"
                        className="input"
                        value={effectiveLabels[key]}
                        onChange={(e) => setLabels({ ...effectiveLabels, [key]: e.target.value })}
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "10px" }}
                        placeholder={["Subject", "Topic", "Subtopic"][i]}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ 
                  fontSize: "0.85rem", 
                  color: "#FFFFFF", 
                  background: "#1E293B", 
                  border: "1px dashed rgba(255, 255, 255, 0.3)", 
                  borderRadius: "12px", 
                  padding: "1rem", 
                  marginBottom: "1rem", 
                  fontFamily: "monospace",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                }}>
                  ✨ {effectiveLabels.l1} → {effectiveLabels.l2} → {effectiveLabels.l3}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pricing Tier</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={() => updateCourse({ id: course._id, priceTier: "free" })}
                  style={{
                    padding: "1rem", borderRadius: "16px", border: "1px solid var(--border)",
                    background: course.priceTier === "free" ? "rgba(255,255,255,0.05)" : "transparent",
                    display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.2s",
                    textAlign: "left", width: "100%", color: "inherit"
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={20} className={course.priceTier === "free" ? "text-accent" : "text-muted"} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Free Access</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Available to all registered users</p>
                  </div>
                  {course.priceTier === "free" && <Check size={18} className="text-accent" style={{ marginLeft: "auto" }} />}
                </button>

                <button
                  onClick={() => updateCourse({ id: course._id, priceTier: "premium" })}
                  style={{
                    padding: "1rem", borderRadius: "16px", border: course.priceTier === "premium" ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: course.priceTier === "premium" ? "rgba(245,158,11,0.05)" : "transparent",
                    display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.2s",
                    textAlign: "left", width: "100%", color: "inherit"
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Settings size={20} style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Premium Tier</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Requires active subscription</p>
                  </div>
                  {course.priceTier === "premium" && <Check size={18} style={{ color: "#F59E0B", marginLeft: "auto" }} />}
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "24px", background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%)" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Hierarchy Depth</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                How many levels deep is this course?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {([1, 2, 3] as const).map((d) => {
                  const preview = d === 1
                    ? `${effectiveLabels.l1} → Cards`
                    : d === 2
                    ? `${effectiveLabels.l1} → ${effectiveLabels.l2} → Cards`
                    : `${effectiveLabels.l1} → ${effectiveLabels.l2} → ${effectiveLabels.l3} → Cards`;
                  return (
                    <button
                      key={d}
                      onClick={() => updateCourse({ id: course._id, hierarchyDepth: d })}
                      style={{
                        padding: "0.85rem 1.1rem", borderRadius: "14px", cursor: "pointer",
                        border: effectiveDepth === d ? "2px solid var(--accent)" : "1px solid rgba(255, 255, 255, 0.18)",
                        background: effectiveDepth === d ? "rgba(245,158,11,0.1)" : "rgba(255, 255, 255, 0.03)",
                        display: "flex", alignItems: "center", gap: "0.85rem",
                        textAlign: "left", width: "100%", color: "inherit", transition: "all 0.2s",
                        boxShadow: effectiveDepth === d ? "0 4px 12px rgba(245, 158, 11, 0.15)" : "none"
                      }}
                      className="hover:bg-white/10 hover:border-white/30 transition-all"
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                        background: effectiveDepth === d ? "var(--accent)" : "#334155",
                        color: effectiveDepth === d ? "#000" : "#F8FAFC",
                        border: effectiveDepth === d ? "none" : "1px solid rgba(255,255,255,0.2)"
                      }}>{d}</span>
                      <span style={{ fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 500, color: effectiveDepth === d ? "var(--text-primary)" : "#E2E8F0" }}>
                        {preview}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "24px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#EF4444", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trash2 size={16} /> Danger Zone
              </h4>
              <p style={{ fontSize: "0.8rem", color: "rgba(239, 68, 68, 0.8)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Permanently delete this course and all of its associated content. This action cannot be undone.
              </p>
              <button
                className="btn"
                disabled={isDeleting}
                onClick={handleDeleteCourse}
                style={{
                  width: "100%",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  borderRadius: "12px",
                  padding: "0.85rem",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
              >
                {isDeleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "2rem", borderRadius: "24px" }}>
          <TopicTree
            courseId={course._id}
            courseName={course.name}
            hierarchyLabels={course.hierarchyLabels}
            hierarchyDepth={effectiveDepth}
          />
        </div>
      )}
    </div>
  );
}
