"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Trophy,
  BarChart3,
  Library,
  Upload,
} from "lucide-react";

interface MobileBottomNavProps {
  role: "student" | "admin";
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  isAction?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses",     label: "Courses",   icon: GraduationCap },
  { href: "/study",       label: "Study",     icon: BookOpen, isAction: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics",   label: "Progress",  icon: BarChart3 },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin",           label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses",   label: "Courses",  icon: Library },
  { href: "/admin/cards",     label: "Cards",    icon: BookOpen },
  { href: "/admin/import",    label: "Import",   icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <div className="mobile-bottom-nav">
      {navItems.map(({ href, label, icon: Icon, isAction }) => {
        const isActive =
          href === "/admin" || href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

        if (isAction) {
          return (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-item mobile-nav-action ${isActive ? "active" : ""}`}
              title={label}
            >
              <Icon size={22} />
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
