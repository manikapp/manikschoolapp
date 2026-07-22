"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SealIcon } from "./seal-icon";

type NavItem = { label: string; href: string; icon: string; comingSoon?: boolean };

const ICONS: Record<string, string> = {
  home: "M4 12l8-8 8 8M6 10v10h12V10",
  clock: "M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cash: "M3 10h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  shieldCheck: "M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z",
  file: "M9 4h6l3 3v13H6V7z",
  clipboard: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM6 6h12v14H6z",
  video: "M4 6h11v12H4zM15 10l5-3v10l-5-3z",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8zM3 12h2m14 0h2M12 3v2m0 14v2",
  logout: "M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M15 16l4-4-4-4M19 12H8"
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/dashboard", icon: "home" },
    { label: "Academic setup", href: "/dashboard/academics", icon: "settings" },
    { label: "Students", href: "/dashboard/students", icon: "clipboard" },
    { label: "Teachers", href: "/dashboard/teachers", icon: "clipboard" },
    { label: "Attendance register", href: "/dashboard/attendance/register", icon: "clock" },
    { label: "Fees", href: "/dashboard/fees", icon: "cash" },
    { label: "Fee clearance", href: "/dashboard/fees/clearance", icon: "shieldCheck" },
    { label: "School stamp", href: "/dashboard/documents/stamp", icon: "file" },
    { label: "Letters", href: "/dashboard/documents/letters", icon: "file" },
    { label: "Score sheets", href: "/dashboard/documents/score-sheets", icon: "file" },
    { label: "Exams and results", href: "/dashboard/exams", icon: "clipboard", comingSoon: true },
    { label: "E-learning", href: "/dashboard/elearning", icon: "video", comingSoon: true }
  ],
  teacher: [
    { label: "Overview", href: "/dashboard", icon: "home" },
    { label: "Scan attendance", href: "/dashboard/attendance", icon: "clock" },
    { label: "Fee clearance", href: "/dashboard/fees/clearance", icon: "shieldCheck" },
    { label: "Exams and results", href: "/dashboard/exams", icon: "clipboard", comingSoon: true },
    { label: "E-learning", href: "/dashboard/elearning", icon: "video", comingSoon: true }
  ],
  student: [
    { label: "Overview", href: "/dashboard", icon: "home" },
    { label: "My payments", href: "/dashboard/fees", icon: "cash" },
    { label: "Exams and results", href: "/dashboard/exams", icon: "clipboard", comingSoon: true },
    { label: "E-learning", href: "/dashboard/elearning", icon: "video", comingSoon: true }
  ]
};

export function DashboardSidebar({
  role,
  schoolName,
  fullName
}: {
  role: string;
  schoolName: string;
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-ink text-paper/80">
      <div className="flex items-center gap-2 border-b border-paper/10 px-5 py-5">
        <SealIcon className="h-6 w-6 text-brass" />
        <div>
          <p className="font-display text-sm font-medium text-paper">{schoolName}</p>
          <p className="text-xs capitalize text-paper/50">{role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.comingSoon ? "#" : item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                active
                  ? "border-l-2 border-brass bg-paper/5 pl-[10px] font-medium text-paper"
                  : "hover:bg-paper/5"
              } ${item.comingSoon ? "cursor-default opacity-50" : ""}`}
              onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <span className="flex items-center gap-3">
                <Icon name={item.icon} />
                {item.label}
              </span>
              {item.comingSoon && (
                <span className="rounded-full bg-paper/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-paper/10 px-3 py-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-paper/5"
        >
          <Icon name="settings" />
          Settings
        </Link>
        <div className="mt-2 flex items-center justify-between px-3">
          <span className="text-xs text-paper/50">{fullName}</span>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex items-center gap-1 text-xs text-paper/50 hover:text-paper"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}
