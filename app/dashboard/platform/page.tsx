import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium">{value}</p>
    </div>
  );
}

export default async function PlatformOverviewPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_super_admin, first_name").eq("id", user.id).single();
  if (!profile?.is_super_admin) redirect("/dashboard");

  const [{ count: schoolCount }, { count: studentCount }, { count: teacherCount }] = await Promise.all([
    supabase.from("schools").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true })
  ]);

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-margin">Platform</p>
      <h1 className="mt-1 font-display text-2xl font-medium">Welcome, {profile.first_name}</h1>
      <p className="mt-1 text-sm text-ink/50">Across every school on ManikSchoolApp.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Schools" value={schoolCount ?? 0} />
        <MetricCard label="Students" value={studentCount ?? 0} />
        <MetricCard label="Teachers" value={teacherCount ?? 0} />
      </div>
    </main>
  );
}
