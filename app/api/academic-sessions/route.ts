import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/academic-sessions — list, with their terms nested
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("academic_sessions")
    .select("*, terms(*)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ academic_sessions: data });
}

// POST /api/academic-sessions
// Body: { name, start_date?, end_date? }
// Creates a session (e.g. "2025/2026") and its 3 terms in one step — Nigerian
// schools always run First/Second/Third, so there's no reason to make an
// admin create each term separately.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("school_id, role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: { code: "forbidden", message: "Admin only" } }, { status: 403 });
  }

  const { name, start_date, end_date } = await request.json();
  if (!name) {
    return NextResponse.json({ error: { code: "validation", message: "name is required" } }, { status: 400 });
  }

  await supabase
    .from("academic_sessions")
    .update({ is_current: false })
    .eq("school_id", profile.school_id)
    .eq("is_current", true);

  const { data: session, error: sessionError } = await supabase
    .from("academic_sessions")
    .insert({ school_id: profile.school_id, name, start_date, end_date, is_current: true })
    .select()
    .single();
  if (sessionError) {
    return NextResponse.json({ error: { code: "server_error", message: sessionError.message } }, { status: 500 });
  }

  const { error: termsError } = await supabase.from("terms").insert([
    { session_id: session.id, name: "first", is_current: true },
    { session_id: session.id, name: "second", is_current: false },
    { session_id: session.id, name: "third", is_current: false }
  ]);
  if (termsError) {
    return NextResponse.json({ error: { code: "server_error", message: termsError.message } }, { status: 500 });
  }

  return NextResponse.json({ academic_session: session }, { status: 201 });
}
