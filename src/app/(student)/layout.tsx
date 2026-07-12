import type { Metadata } from "next";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export const metadata: Metadata = {
  title: "Dashboard | RecallIQ",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <StudentSidebar />
      <main className="main-content">
        <div className="app-center">
          {children}
        </div>
      </main>
      <MobileBottomNav role="student" />
    </div>
  );
}
