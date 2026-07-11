"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MermaidBlock } from "./MermaidBlock";
import { ChartBlock } from "./ChartBlock";

const MD_OPTS = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
};

interface Segment {
  type: "markdown" | "mermaid" | "chart";
  content: string;
}

/**
 * Parses a markdown string and splits it into segments.
 * Special fence blocks (```mermaid, ```chart) become typed segments.
 */
function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  // Matches ```mermaid or ```chart fences (with optional trailing whitespace)
  const FENCE_RE = /^```(mermaid|chart)\s*\n([\s\S]*?)^```\s*$/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FENCE_RE.exec(raw)) !== null) {
    // Text before this fence
    const before = raw.slice(lastIndex, match.index);
    if (before.trim()) {
      segments.push({ type: "markdown", content: before });
    }

    segments.push({
      type: match[1] as "mermaid" | "chart",
      content: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last fence
  const tail = raw.slice(lastIndex);
  if (tail.trim()) {
    segments.push({ type: "markdown", content: tail });
  }

  // Fallback: entire content is plain markdown
  if (segments.length === 0) {
    segments.push({ type: "markdown", content: raw });
  }

  return segments;
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ContentRendererProps {
  children: string;
  /** If true, normalises escaped newlines (\\n → real newlines) */
  fixEscapes?: boolean;
}

/**
 * Drop-in replacement for bare <ReactMarkdown> calls in card components.
 * Automatically detects ```mermaid and ```chart fences and renders them
 * as live diagram/chart components. Everything else is rendered as
 * standard Markdown + KaTeX.
 */
export function ContentRenderer({ children, fixEscapes = true }: ContentRendererProps) {
  if (!children) return null;

  const content = fixEscapes ? children.replace(/\\n/g, "\n") : children;
  const segments = parseSegments(content);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "mermaid") {
          return <MermaidBlock key={i} definition={seg.content} />;
        }
        if (seg.type === "chart") {
          return <ChartBlock key={i} raw={seg.content} />;
        }
        return (
          <ReactMarkdown key={i} {...MD_OPTS}>
            {seg.content}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
