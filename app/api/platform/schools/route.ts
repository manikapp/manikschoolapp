import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/platform/schools — every school on the platform, with basic counts.
// Only reachable by a super admin: RLS grants full cross-school access via
// is_super_admin(), and this route double-checks the flag at the app level too.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: { code: "forbidden", message: "Super admin only" } }, { status: 403 });
  }

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id, name, address, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });

  // Per-school counts — fine at this scale as separate queries; worth a proper
  // aggregate view once the platform has enough schools to matter for latency.
  const withCounts = await Promise.all(
    (schools ?? []).map(async (school) => {
      const [{ count: studentCount }, { count: teacherCount }] = await Promise.all([
        supabase
          .from("students")
          .select("*, users!inner(school_id)", { count: "exact", head: true })
          .eq("users.school_id", school.id),
        supabase
          .from("teachers")
          .select("*, users!inner(school_id)", { count: "exact", head: true })
          .eq("users.school_id", school.id)
      ]);
      return { ...school, student_count: studentCount ?? 0, teacher_count: teacherCount ?? 0 };
    })
  );

  return NextResponse.json({ schools: withCounts });
}
