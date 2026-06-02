import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Mode | RecallIQ",
};

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <main style={{ flex: 1, position: "relative" }} className="animate-in">
        {children}
      </main>
    </div>
  );
}
