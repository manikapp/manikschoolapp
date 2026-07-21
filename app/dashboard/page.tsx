import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

        <div className="mt-6 flex flex-col gap-2">
          {profile?.role === "teacher" && (
            <>
              <Link
                href="/dashboard/attendance"
                className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                Scan student attendance →
              </Link>
              <Link
                href="/dashboard/fees/clearance"
                className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                Check fee clearance at the gate →
              </Link>
            </>
          )}
          {profile?.role === "admin" && (
            <>
              <Link
                href="/dashboard/attendance/register"
                className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                View today's attendance register →
              </Link>
              <Link
                href="/dashboard/fees"
                className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                Record and view fee payments →
              </Link>
              <Link
                href="/dashboard/fees/clearance"
                className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
              >
                Check fee clearance at the gate →
              </Link>
            </>
          )}
          {profile?.role === "student" && (
            <Link
              href="/dashboard/fees"
              className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/[0.03]"
            >
              View my fee payments →
            </Link>
          )}
        </div>

        <p className="mt-6 text-sm text-black/50">
          Phase 3 (fees & clearance) is wired up. Documents, exams/results, and e-learning
          build on top of this per the phased roadmap.
        </p>
      </div>
    </main>
  );
}
