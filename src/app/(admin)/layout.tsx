import type { Metadata } from "next";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export const metadata: Metadata = {
  title: { template: "%s | Admin · RecallIQ", default: "Admin · RecallIQ" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
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
