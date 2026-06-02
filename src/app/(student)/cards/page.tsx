"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { 
  Filter, 
  Archive, 
  BookOpen, 
  Search, 
  Clock, 
  Activity, 
  RefreshCcw,
  LayoutGrid,
  HelpCircle
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function MyCardsPage() {
  const { convexUser: user } = useConvexUser();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const cards = useQuery(api.userCards.getUserCards, 
    user ? { 
      userId: user._id, 
      isArchived: viewMode === "archived",
      courseId: selectedCourse === "all" ? undefined : (selectedCourse as Id<"courses">)
    } : "skip"
  );

  const courses = useQuery(api.courses.listAllCourses) || [];
  const toggleArchive = useMutation(api.userCards.toggleArchiveCard);

  const filteredCards = cards?.filter(c => 
    c.card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hierarchy.course?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="animate-in">
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            My Learning Repository
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            Manage your active study pool and archive completed content.
          </p>
        </div>
        
        {/* Switch UI Refactored */}
        <div className="segment-control">
          <div 
            className="segment-slider" 
            style={{ 
              width: "calc(50% - 4px)",
              transform: viewMode === "active" ? "translateX(0)" : "translateX(100%)" 
            }} 
          />
          <button 
            className={`segment-item ${viewMode === "active" ? "active" : ""}`}
            onClick={() => setViewMode("active")}
          >
            Active Pool
          </button>
          <button 
            className={`segment-item ${viewMode === "archived" ? "active" : ""}`}
            onClick={() => setViewMode("archived")}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, position: "relative", minWidth: "300px" }}>
          <Search style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={20} />
          <input 
            type="text" 
            placeholder="Search by content or course..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: "100%", paddingLeft: "3.5rem", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          />
        </div>
        
        <select 
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input"
          style={{ width: "240px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontWeight: 700 }}
        >
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        {[
          { label: "Total Cards", value: cards?.length || 0, icon: <LayoutGrid size={24} />, color: "var(--accent)" },
          { label: "Stability (Avg)", value: `${(filteredCards.reduce((acc, c) => acc + c.stability, 0) / (filteredCards.length || 1)).toFixed(1)}d`, icon: <Activity size={24} />, color: "#58CC02" },
          { label: "Archived", value: (cards?.filter(c => c.isArchived).length) || 0, icon: <Archive size={24} />, color: "#FF4B4B" }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ padding: "0.75rem", borderRadius: "12px", background: "rgba(255,255,255,0.05)", color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: "1.5rem", fontWeight: 600, fontFamily: "var(--font-display)" }}>{stat.value}</p>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards Table */}
      <div className="card" style={{ padding: 0, overflow: "visible", background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
              <th style={{ textAlign: "left", padding: "1.25rem 2rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Card Content</th>
              <th style={{ textAlign: "left", padding: "1.25rem 2rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Course / Hierarchy</th>
              <th style={{ textAlign: "left", padding: "1.25rem 2rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  FSRS Metrics
                  <div className="tooltip-container">
                    <HelpCircle size={14} style={{ cursor: "help" }} />
                    <div className="tooltip-content" style={{ fontWeight: 500, textTransform: "none", letterSpacing: "normal" }}>
                      Scientific memory metrics based on the Free Spaced Repetition Scheduler algorithm.
                    </div>
                  </div>
                </div>
              </th>
              <th style={{ textAlign: "right", padding: "1.25rem 2rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <BookOpen size={48} opacity={0.3} />
                    <p style={{ fontWeight: 600 }}>No cards found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCards.map((item) => (
                <tr key={item._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} className="hover:bg-white/5">
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <div style={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: "1rem" }}>
                      {item.card.type === "cloze" ? item.card.clozeTemplate : item.card.front}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "var(--accent)" }}>
                        {item.card.type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>{item.hierarchy.course}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item.hierarchy.subject} &rsaquo; {item.hierarchy.topic}
                    </div>
                  </td>
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <div style={{ display: "flex", gap: "1.5rem" }}>
                      <div className="tooltip-container">
                        <Clock size={14} style={{ display: "inline", marginRight: "4px", color: "#58CC02" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.stability.toFixed(1)}d</span>
                        <div className="tooltip-content">
                          <strong>Stability</strong><br/>
                          Estimated time until recall drops below 90%. Your memory is safe for this long.
                        </div>
                      </div>
                      
                      <div className="tooltip-container">
                        <Filter size={14} style={{ display: "inline", marginRight: "4px", color: "#FFC107" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.difficulty.toFixed(1)}</span>
                        <div className="tooltip-content">
                          <strong>Difficulty</strong><br/>
                          Scale 1-10 of card complexity. Higher means more frequent reviews needed.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
                    <button 
                      onClick={() => toggleArchive({ userId: user!._id, cardId: item.cardId, archive: !item.isArchived })}
                      style={{ 
                        padding: "0.5rem 1rem", 
                        borderRadius: "10px", 
                        background: item.isArchived ? "rgba(88, 204, 2, 0.1)" : "rgba(255, 75, 75, 0.1)",
                        color: item.isArchived ? "#58CC02" : "#FF4B4B",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      {item.isArchived ? (
                        <><RefreshCcw size={16} /> Restore</>
                      ) : (
                        <><Archive size={16} /> Archive</>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
