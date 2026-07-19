"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  BookOpen, LayoutDashboard, BarChart3, LogOut, Trophy, GraduationCap, List, Sparkles
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/cards", label: "My Cards", icon: List },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/personal", label: "Personal Space", icon: Sparkles },
  { href: "/study", label: "Study Now", icon: BookOpen },
  { href: "/analytics", label: "Progress", icon: BarChart3 },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span>Recall<em>IQ</em></span>
        </Link>
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          JEE · NEET · GATE
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname === href || pathname.startsWith(href + "/") ? "active" : ""}`}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        {user && (
          <div style={{ padding: "0.5rem 1.5rem", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.fullName ?? user.primaryEmailAddress?.emailAddress}
            </p>
            <span className="badge badge-free" style={{ marginTop: 4 }}>Free</span>
          </div>
        )}
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
