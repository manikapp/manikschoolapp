import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium">{value}</p>
    </div>
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

  const today = new Date().toISOString().slice(0, 10);
  let cards: { label: string; value: string | number }[] = [];

  if (profile?.role === "admin") {
    const [{ count: attendanceToday }, { count: pendingExams }, { data: payments }] = await Promise.all([
      supabase.from("student_attendance").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("exams").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("fee_payments").select("amount")
    ]);
    const totalCollected = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    cards = [
      { label: "Clocked in today", value: attendanceToday ?? 0 },
      { label: "Exams pending review", value: pendingExams ?? 0 },
      { label: "Total fees collected", value: `\u20a6${totalCollected.toLocaleString()}` }
    ];
  } else if (profile?.role === "teacher") {
    const { count: attendanceToday } = await supabase
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today);
    cards = [{ label: "Students clocked in today", value: attendanceToday ?? 0 }];
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
        label: "Today's attendance",
        value: attendance?.clock_in_time ? `Clocked in ${new Date(attendance.clock_in_time).toLocaleTimeString()}` : "Not yet"
      }
    ];
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">
        Welcome, {profile?.first_name} {profile?.last_name}
      </h1>
      <p className="mt-1 text-sm text-ink/50">Here's what's happening today.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>
    </main>
  );
}
