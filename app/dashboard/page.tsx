import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, user_code, schools(name)")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <p className="text-sm text-black/50">
          {(profile?.schools as unknown as { name: string })?.name ?? "School Sleek"}
        </p>
        <h1 className="mt-1 text-xl font-medium">
          Welcome, {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="mt-1 text-sm text-black/60">
          {profile?.role} · {profile?.user_code}
        </p>

        <p className="mt-6 text-sm text-black/50">
          This is the Foundation-phase scaffold — auth and identity are wired up.
          Attendance, exams, results, fees, and e-learning modules build on top of
          this per the phased roadmap in the design doc.
        </p>
      </div>
    </main>
  );
}
