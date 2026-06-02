"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Plus, Check, X, Loader2, BookOpen, Settings, Save, ChevronLeft } from "lucide-react";
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
    <div className="animate-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em" }}>Course Manager</h1>
          <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Create and manage learning courses and content hierarchy</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "14px" }}>
          <Plus size={20} style={{ marginRight: "0.5rem" }} />
          New Course
        </button>
      </div>

      <style>{`
        .course-card {
          padding: 1.5rem; background: var(--bg-elevated); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }
        .course-card:hover { 
          transform: translateY(-5px) translateZ(0); 
          border-color: rgba(255,255,255,0.2); 
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.4); 
        }
        .course-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, var(--accent) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.3s; z-index: 0;
        }
        .course-card:hover::before { opacity: 0.03; }
        
        .status-badge {
          font-size: 0.65rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 20px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
      `}</style>

      {/* Toolbar */}
      {!isCreating && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%", paddingLeft: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "14px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "published", "draft"] as const).map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? "btn btn-primary" : "btn btn-ghost"}
                style={{ borderRadius: "12px", fontSize: "0.85rem", textTransform: "capitalize" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreateCourse} className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem", borderRadius: "var(--radius-lg)" }}>
          <h3 style={{ marginBottom: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={18} className="text-accent" /> Create New Course
          </h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Course Name (e.g. Physics Pro 2027)"
                value={newCourseName}
                onChange={(e) => {
                  setNewCourseName(e.target.value);
                  setNewCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
                }}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="URL Slug"
                value={newCourseSlug}
                onChange={(e) => setNewCourseSlug(e.target.value)}
                className="input"
                style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", height: "42px" }}>Create</button>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      {courses === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}><Loader2 className="animate-spin text-muted" /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredCourses.map((course) => (
            <div 
              key={course._id} 
              className="course-card"
              onClick={() => setActiveCourseId(course._id)}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <span className="status-badge" style={{ 
                    background: course.isPublished ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                    color: course.isPublished ? "var(--success)" : "var(--text-muted)",
                    border: `1px solid ${course.isPublished ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"}`
                  }}>
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                  {course.priceTier === "premium" && (
                    <span className="status-badge" style={{ 
                      background: "rgba(245,158,11,0.1)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.2)"
                    }}>
                      Premium
                    </span>
                  )}
                </div>
                
                <h3 style={{ fontSize: "1.5rem", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  {course.name}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "monospace", opacity: 0.7 }}>
                  /{course.slug}
                </p>
              </div>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {/* Future: Add small metric icons here */}
                </div>
                <button className="btn btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "10px" }}>
                  <Settings size={16} style={{ marginRight: "0.5rem" }} />
                  Configure
                </button>
              </div>
            </div>
          ))}
          {filteredCourses.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "5rem 2rem", background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border)", borderRadius: "32px", color: "var(--text-muted)" }}>
              <BookOpen size={48} style={{ margin: "0 auto 1.5rem", opacity: 0.1 }} />
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>No courses found</p>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Try a different search term or create a new course.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────────────

function CourseDetailView({ courseId, onBack }: { courseId: Id<"courses">, onBack: () => void }) {
  const course = useQuery(api.courses.getCourse, { courseId });
  const updateCourse = useMutation(api.courses.updateCourse);

  const [desc, setDesc] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"general" | "content">("general");
  const [labels, setLabels] = useState<{ l1: string; l2: string; l3: string } | undefined>(undefined);

  if (course === undefined) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Loader2 className="animate-spin text-muted" /></div>;
  }

  if (course === null) {
    return <div>Course not found.</div>;
  }

  // Initialize state once from live data
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

  return (
    <div className="animate-in" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Header Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: "0.5rem 1rem", borderRadius: "12px" }}>
          <ChevronLeft size={16} style={{ marginRight: "0.5rem" }} /> Back
        </button>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {course.isPublished ? "Publicly Visible" : "Draft Mode"}
          </span>
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
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem", opacity: 0.8 }}>
          ID: {course._id.substring(0, 12)}... • /{course.slug}
        </p>
      </div>

      {/* Tabs */}
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
          {/* Left: Info */}
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "24px" }}>
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
              <textarea 
                className="input"
                style={{ width: "100%", minHeight: "160px", resize: "vertical", background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "1rem", fontSize: "0.95rem", lineHeight: 1.6 }}
                value={desc || ""}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Write a compelling overview for your students..."
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveDesc} 
                  disabled={desc === course.description}
                  style={{ borderRadius: "10px", padding: "0.5rem 1.25rem" }}
                >
                  <Save size={16} style={{ marginRight: "0.5rem" }} /> Save Changes
                </button>
              </div>
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
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "10px", padding: "0.75rem", marginBottom: "1rem", fontFamily: "monospace" }}>
                  {effectiveLabels.l1} → {effectiveLabels.l2} → {effectiveLabels.l3}
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={handleSaveLabels}
                  disabled={JSON.stringify(effectiveLabels) === JSON.stringify(course.hierarchyLabels ?? { l1: "Subject", l2: "Topic", l3: "Subtopic" })}
                  style={{ borderRadius: "10px", fontSize: "0.85rem" }}
                >
                  <Save size={14} style={{ marginRight: "0.5rem" }} /> Apply Labels
                </button>
              </div>
            </div>
          </div>

          {/* Right: Pricing & Status */}
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
                        padding: "0.75rem 1rem", borderRadius: "12px", cursor: "pointer",
                        border: effectiveDepth === d ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: effectiveDepth === d ? "rgba(245,158,11,0.05)" : "transparent",
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        textAlign: "left", width: "100%", color: "inherit", transition: "all 0.2s"
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
                        background: effectiveDepth === d ? "var(--accent)" : "rgba(255,255,255,0.05)",
                        color: effectiveDepth === d ? "#000" : "var(--text-muted)"
                      }}>{d}</span>
                      <span style={{ fontSize: "0.8rem", fontFamily: "monospace", color: effectiveDepth === d ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {preview}
                      </span>
                    </button>
                  );
                })}
              </div>
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
