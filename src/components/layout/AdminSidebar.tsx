"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard, Library, BookOpen, BarChart3, LogOut, Settings, Upload
} from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Overview",    icon: LayoutDashboard },
  { href: "/admin/courses",   label: "Courses",     icon: Library },
  { href: "/admin/cards",     label: "Cards",       icon: BookOpen },
  { href: "/admin/import",    label: "Bulk Import", icon: Upload },
  { href: "/admin/analytics", label: "Analytics",   icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <span>Recall<em>IQ</em></span>
        </Link>
        <p style={{
          fontSize: "0.65rem", color: "var(--accent)", marginTop: 4,
          letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700,
        }}>
          Admin CMS
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <Link href="/dashboard" className="nav-item">
          <Settings size={17} />
          Student View
        </Link>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
