"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidBlockProps {
  definition: string;
}

export function MermaidBlock({ definition }: MermaidBlockProps) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!definition?.trim()) return;

    let cancelled = false;
    let rafId: number;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#1E293B",
            primaryTextColor: "#F8FAFC",
            primaryBorderColor: "#475569",
            lineColor: "#94A3B8",
            secondaryColor: "#0F172A",
            tertiaryColor: "#1E293B",
            background: "transparent",
            mainBkg: "#1E293B",
            nodeBorder: "#475569",
            clusterBkg: "#1E293B",
            titleColor: "#F8FAFC",
            edgeLabelBackground: "#0F172A",
            fontFamily: "Inter, var(--font-sans, sans-serif)",
            fontSize: "14px",
          },
          flowchart: {
            curve: "basis",
            padding: 10,
            nodeSpacing: 30,
            rankSpacing: 36,
            htmlLabels: true,
          },
          securityLevel: "loose",
        });

        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, definition.trim());

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;

          // Inject scoped CSS to center text both vertically and horizontally
          const style = document.createElement("style");
          style.textContent = `
            #${uniqueId} {
              overflow: visible !important;
              display: block !important;
            }
            #${uniqueId} foreignObject {
              overflow: visible !important;
            }
            #${uniqueId} foreignObject > div {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              height: 100% !important;
              width: 100% !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            #${uniqueId} .nodeLabel {
              display: inline-block !important;
              text-align: center !important;
              white-space: nowrap !important;
              font-size: 14px !important;
              font-weight: 600 !important;
              line-height: 1.2 !important;
              color: #F1F5F9 !important;
              padding: 0 16px !important;
              margin: 0 !important;
            }
            #${uniqueId} .node rect,
            #${uniqueId} .node circle,
            #${uniqueId} .node polygon {
              stroke-width: 1.5px !important;
            }
          `;
          ref.current.appendChild(style);

          // Centering: keep Mermaid's natural SVG width (= content width).
          // max-width:100% for responsiveness. margin:0 auto to center it.
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.display = "block";
            svgEl.style.margin = "0 auto";
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
            svgEl.style.overflow = "visible";
          }

          // Defer node-widening to rAF so foreignObject HTML is laid out first.
          rafId = requestAnimationFrame(() => {
            if (cancelled || !ref.current) return;

            const nodeEls = ref.current.querySelectorAll(".node");
            nodeEls.forEach((node) => {
              const rect = node.querySelector("rect");
              const fo = node.querySelector("foreignObject");
              if (rect && fo) {
                const labelEl = fo.querySelector(".nodeLabel") as HTMLElement;
                if (labelEl) {
                  const contentWidth = labelEl.scrollWidth || labelEl.getBoundingClientRect().width;
                  const rectWidth = parseFloat(rect.getAttribute("width") || "0");

                  if (contentWidth > 0 && contentWidth + 4 > rectWidth && rectWidth > 0) {
                    const newWidth = contentWidth + 8;
                    const diff = newWidth - rectWidth;

                    rect.setAttribute("width", String(newWidth));
                    const curX = parseFloat(rect.getAttribute("x") || "0");
                    rect.setAttribute("x", String(curX - diff / 2));

                    fo.setAttribute("width", String(newWidth));
                    const foX = parseFloat(fo.getAttribute("x") || "0");
                    fo.setAttribute("x", String(foX - diff / 2));
                  }
                }
              }
            });
          });

          setRendered(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
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
    <div style={{ margin: "1.5rem 0", position: "relative" }}>
      {/* Loading shimmer */}
      {!rendered && (
        <div style={{
          height: "140px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontSize: "0.85rem",
          gap: "0.5rem",
        }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
          Rendering diagram…
        </div>
      )}

      {/* Textured Diagram Canvas */}
      <div
        style={{
          display: rendered ? "block" : "none",
          position: "relative",
          borderRadius: "18px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backgroundColor: "#0B1120",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0, 0, 0, 0.35)",
          overflowX: "auto",
          padding: "2.5rem 2rem 2rem 2rem",
        }}
      >
        {/* Center-Faded Dot Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.28) 1.5px, transparent 0)`,
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 85%)",
          }}
        />

        {/* Canvas Label */}
        <div
          style={{
            position: "absolute",
            top: "0.65rem",
            left: "1rem",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          Visual Concept Map
        </div>

        <div ref={ref} style={{ position: "relative", zIndex: 2 }} />
      </div>
    </div>
  );
}