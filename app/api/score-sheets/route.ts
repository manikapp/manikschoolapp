import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateScoreSheetPdf } from "@/lib/pdf";
import { uploadDocument } from "@/lib/storage";

// GET /api/score-sheets — list generated score sheets for the caller's school
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("score_sheets")
    .select("id, pdf_url, created_at, class_arms(display_name), subjects(name), terms(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ score_sheets: data });
}

// POST /api/score-sheets — generate a blank score sheet PDF for a class/subject/term
// Body: { class_arm_id, subject_id, term_id, columns? }
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
    .select("school_id, role, schools(name)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: { code: "forbidden", message: "Admin only" } }, { status: 403 });
  }

  const { class_arm_id, subject_id, term_id, columns } = await request.json();
  if (!class_arm_id || !subject_id || !term_id) {
    return NextResponse.json(
      { error: { code: "validation", message: "class_arm_id, subject_id, and term_id are required" } },
      { status: 400 }
    );
  }

  const [{ data: classArm }, { data: subject }, { data: term }, { data: enrollments }] = await Promise.all([
    supabase.from("class_arms").select("display_name").eq("id", class_arm_id).single(),
    supabase.from("subjects").select("name").eq("id", subject_id).single(),
    supabase.from("terms").select("name").eq("id", term_id).single(),
    supabase
      .from("student_class_enrollments")
      .select("students(admission_number, users(first_name, last_name))")
      .eq("class_arm_id", class_arm_id)
      .eq("status", "active")
  ]);

  const students = (enrollments ?? []).map((e) => {
    const s = e.students as unknown as { admission_number: string; users: { first_name: string; last_name: string } };
    return { admission_number: s.admission_number, full_name: `${s.users.first_name} ${s.users.last_name}` };
  });

  const school = profile.schools as unknown as { name: string };
  const pdfBuffer = generateScoreSheetPdf({
    schoolName: school.name,
    classArmName: classArm?.display_name ?? "",
    subjectName: subject?.name ?? "",
    termName: term?.name ?? "",
    columns: columns ?? ["CA1", "CA2", "CA3", "Exam", "Total"],
    students
  });

  const path = `score-sheets/${profile.school_id}-${Date.now()}.pdf`;
  const pdfUrl = await uploadDocument(supabase, path, pdfBuffer, "application/pdf");

  const { data: sheet, error } = await supabase
    .from("score_sheets")
    .insert({
      school_id: profile.school_id,
      class_arm_id,
      subject_id,
      term_id,
      pdf_url: pdfUrl,
      generated_by: user.id
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ score_sheet: sheet }, { status: 201 });
}
