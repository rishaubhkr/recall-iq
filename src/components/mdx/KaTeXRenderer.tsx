import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function KaTeXRenderer({ content }: { content: string }) {
  if (!content) return null;
  
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none math-renderer overflow-x-auto pb-2">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
