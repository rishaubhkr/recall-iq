"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidBlockProps {
  definition: string;
}

/**
 * Renders a Mermaid.js diagram from a text definition.
 * Dynamically imports Mermaid so it never blocks initial page load.
 * Falls back to a styled code block if parsing fails.
 */
export function MermaidBlock({ definition }: MermaidBlockProps) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!definition?.trim()) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#1E293B",
            primaryTextColor: "#F1F5F9",
            primaryBorderColor: "#334155",
            lineColor: "#94A3B8",
            secondaryColor: "#0F172A",
            tertiaryColor: "#1E293B",
            background: "#0F172A",
            mainBkg: "#1E293B",
            nodeBorder: "#334155",
            clusterBkg: "#1E293B",
            titleColor: "#F8FAFC",
            edgeLabelBackground: "#0F172A",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          flowchart: { curve: "basis", padding: 16 },
          securityLevel: "loose",
        });

        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, definition.trim());

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
          setRendered(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [definition, id]);

  if (error) {
    return (
      <div style={{
        margin: "1.25rem 0",
        borderRadius: "12px",
        border: "1px dashed rgba(239, 68, 68, 0.4)",
        background: "rgba(239, 68, 68, 0.05)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "0.5rem 1rem",
          background: "rgba(239, 68, 68, 0.1)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#EF4444",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}>
          ⚠ Diagram parse error
        </div>
        <pre style={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.8rem",
          color: "#94A3B8",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          {definition}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ margin: "1.25rem 0", position: "relative" }}>
      {/* Loading shimmer */}
      {!rendered && (
        <div style={{
          height: "120px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#475569",
          fontSize: "0.85rem",
          gap: "0.5rem",
        }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
          Rendering diagram…
        </div>
      )}
      <div
        ref={ref}
        style={{
          display: rendered ? "block" : "none",
          padding: "1.25rem",
          borderRadius: "12px",
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center",
          overflowX: "auto",
        }}
      />
    </div>
  );
}
