import type { Metadata } from "next";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export const metadata: Metadata = {
  title: { template: "%s | Admin · RecallIQ", default: "Admin · RecallIQ" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
      <main className="main-content">
        <div className="app-center">
          {children}
        </div>
      </main>
      <MobileBottomNav role="admin" />
    </div>
  );
}
