import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/exams?class_arm_id=&status=
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const classArmId = searchParams.get("class_arm_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("exams")
    .select("*, subjects(name), class_arms(display_name), teachers(id, users(first_name, last_name))")
    .order("created_at", { ascending: false });
  if (classArmId) query = query.eq("class_arm_id", classArmId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ exams: data });
}

// POST /api/exams — teacher creates an exam shell
// Body: { subject_id, class_arm_id, term_id, title, type, duration_minutes, total_marks, assessment_component_id? }
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("school_id, role, teachers(id)")
    .eq("id", user.id)
    .single();

  const teacher = (profile?.teachers as unknown as { id: string }[])?.[0];
  if (!teacher) {
    return NextResponse.json({ error: { code: "forbidden", message: "Only teachers can create exams" } }, { status: 403 });
  }

  const body = await request.json();
  const { subject_id, class_arm_id, term_id, title, type, duration_minutes, total_marks, assessment_component_id } = body;
  if (!subject_id || !class_arm_id || !term_id || !title) {
    return NextResponse.json(
      { error: { code: "validation", message: "subject_id, class_arm_id, term_id, and title are required" } },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("exams")
    .insert({
      school_id: profile!.school_id,
      subject_id,
      class_arm_id,
      term_id,
      teacher_id: teacher.id,
      title,
      type: type ?? "cbt",
      duration_minutes,
      total_marks,
      assessment_component_id: assessment_component_id ?? null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ exam: data }, { status: 201 });
}
