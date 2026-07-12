import type { Metadata } from "next";
import { StudentSidebar } from "@/components/layout/StudentSidebar";

export const metadata: Metadata = {
  title: "Dashboard | RecallIQ",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <StudentSidebar />
      <main style={{
        marginLeft: 260,
        minHeight: "100vh",
        padding: "2rem",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          flex: 1,
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
