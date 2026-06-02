"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Play, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

interface SubtopicListProps {
  topics: any[];
  subjectColor: string;
  userTier: string;
}

export function SubtopicList({ topics, subjectColor, userTier }: SubtopicListProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (id: string) => {
    const next = new Set(expandedTopics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTopics(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1rem" }}>
      {topics.map((topic: any) => (
        <div key={topic._id} style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
          {/* Topic Header */}
          <button
            onClick={() => toggleTopic(topic._id)}
            style={{
              width: "100%",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "var(--transition)"
            }}
            className="hover:bg-white/5"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ color: "var(--accent)", display: "flex", alignItems: "center" }}>
                {expandedTopics.has(topic._id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.02em", color: "var(--text-primary)" }}>{topic.name.toUpperCase()}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>{topic.subtopics.length} MODULES</p>
              </div>
            </div>
          </button>

          {/* Subtopics */}
          {expandedTopics.has(topic._id) && (
            <div style={{ padding: "0 1rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topic.subtopics.map((subtopic: any) => (
                <div 
                  key={subtopic._id}
                  style={{ 
                    padding: "0.6rem 0.8rem", 
                    borderRadius: "10px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    transition: "var(--transition)"
                  }}
                  className="hover:border-accent/30 group"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <CheckCircle2 size={14} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>{subtopic.name}</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link 
                      href={`/study?mode=subject&subtopic=${subtopic._id}`}
                      className="btn btn-primary"
                      style={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: "8px",
                        padding: 0
                      }}
                    >
                      <Play size={12} fill="currentColor" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
