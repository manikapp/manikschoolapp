import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ICONS: Record<string, string> = {
  clock: "M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  clipboard: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM6 6h12v14H6z",
  cash: "M3 10h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  shieldCheck: "M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z",
  file: "M9 4h6l3 3v13H6V7z"
};

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ icon, tone, label, value }: { icon: string; tone: string; label: string; value: string | number }) {
  const toneClasses: Record<string, string> = {
    verdant: "bg-verdant/10 text-verdant",
    brass: "bg-brass/10 text-brass-dark",
    margin: "bg-margin/10 text-margin"
  };
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${toneClasses[tone]}`}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </div>
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium">{value}</p>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-4 text-sm hover:border-ink/30"
    >
      <Icon name={icon} className="h-5 w-5 text-brass" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, school_id")
    .eq("id", user.id)
    .single();

  const { data: currentTerm } = await supabase
    .from("terms")
    .select("name, academic_sessions!inner(name, school_id)")
    .eq("is_current", true)
    .eq("academic_sessions.school_id", profile?.school_id ?? "")
    .maybeSingle();

  const termLabel = currentTerm
    ? `${(currentTerm.name as string)[0].toUpperCase()}${(currentTerm.name as string).slice(1)} term, ${
        (currentTerm.academic_sessions as unknown as { name: string }).name
      }`
    : new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const today = new Date().toISOString().slice(0, 10);
  let cards: { icon: string; tone: string; label: string; value: string | number }[] = [];
  let quickActions: { href: string; icon: string; label: string }[] = [];

  if (profile?.role === "admin") {
    const [{ count: attendanceToday }, { count: pendingExams }, { data: payments }] = await Promise.all([
      supabase.from("student_attendance").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("exams").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("fee_payments").select("amount")
    ]);
    const totalCollected = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    cards = [
      { icon: "clock", tone: "verdant", label: "Clocked in today", value: attendanceToday ?? 0 },
      { icon: "clipboard", tone: "margin", label: "Exams pending review", value: pendingExams ?? 0 },
      { icon: "cash", tone: "brass", label: "Total fees collected", value: `\u20a6${totalCollected.toLocaleString()}` }
    ];
    quickActions = [
      { href: "/dashboard/attendance/register", icon: "clock", label: "View attendance register" },
      { href: "/dashboard/fees", icon: "cash", label: "Record a fee payment" },
      { href: "/dashboard/documents/letters", icon: "file", label: "Write a letter" }
    ];
  } else if (profile?.role === "teacher") {
    const { count: attendanceToday } = await supabase
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today);
    cards = [{ icon: "clock", tone: "verdant", label: "Students clocked in today", value: attendanceToday ?? 0 }];
    quickActions = [
      { href: "/dashboard/attendance", icon: "clock", label: "Scan student attendance" },
      { href: "/dashboard/fees/clearance", icon: "shieldCheck", label: "Check fee clearance" }
    ];
  } else {
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
    const { data: attendance } = student
      ? await supabase
          .from("student_attendance")
          .select("clock_in_time")
          .eq("student_id", student.id)
          .eq("date", today)
          .maybeSingle()
      : { data: null };
    cards = [
      {
        icon: "clock",
        tone: "verdant",
        label: "Today's attendance",
        value: attendance?.clock_in_time ? `Clocked in ${new Date(attendance.clock_in_time).toLocaleTimeString()}` : "Not yet"
      }
    ];
    quickActions = [{ href: "/dashboard/fees", icon: "cash", label: "View my payments" }];
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-margin">{termLabel}</p>
      <h1 className="mt-1 font-display text-2xl font-medium">
        Welcome, {profile?.first_name} {profile?.last_name}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <MetricCard key={c.label} {...c} />
        ))}
      </div>

      {quickActions.length > 0 && (
        <div className="mt-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">Quick actions</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((a) => (
              <QuickAction key={a.href} {...a} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
