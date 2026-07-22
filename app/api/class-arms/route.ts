import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/class-arms — list, for the current session
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_arms")
    .select("*, academic_sessions!inner(is_current)")
    .eq("academic_sessions.is_current", true)
    .order("level")
    .order("arm_name");
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ class_arms: data });
}

// POST /api/class-arms
// Body: { level, arm_name, department_id? }
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

  const { level, arm_name, department_id } = await request.json();
  if (!level || !arm_name) {
    return NextResponse.json({ error: { code: "validation", message: "level and arm_name are required" } }, { status: 400 });
  }

  const { data: currentSession } = await supabase
    .from("academic_sessions")
    .select("id")
    .eq("school_id", profile.school_id)
    .eq("is_current", true)
    .maybeSingle();

  if (!currentSession) {
    return NextResponse.json(
      { error: { code: "validation", message: "Create an academic session before adding class arms" } },
      { status: 400 }
    );
  }

  const displayName = `${level.toUpperCase()}${arm_name.toUpperCase()}`;

  const { data: classArm, error } = await supabase
    .from("class_arms")
    .insert({
      school_id: profile.school_id,
      session_id: currentSession.id,
      level,
      arm_name,
      display_name: displayName,
      department_id: department_id || null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ class_arm: classArm }, { status: 201 });
}
