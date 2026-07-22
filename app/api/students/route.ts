import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrToken } from "@/lib/qr";

// GET /api/students — list, with class arm and login info
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, admission_number, date_of_birth, gender, users(first_name, last_name, email, user_code), class_arms(display_name)")
    .order("admission_number");
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ students: data });
}

// POST /api/students — admit a student: creates their login AND their school record
// Body: { first_name, last_name, email, password, admission_number, class_arm_id, date_of_birth?, gender? }
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

  const body = await request.json();
  const { first_name, last_name, email, password, admission_number, class_arm_id, date_of_birth, gender } = body;
  if (!first_name || !last_name || !email || !password || !admission_number || !class_arm_id) {
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message: "first_name, last_name, email, password, admission_number, and class_arm_id are required"
        }
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: { code: "auth_error", message: authError?.message ?? "Could not create the student's login" } },
      { status: 400 }
    );
  }
  const userId = authUser.user.id;

  try {
    const { data: classArm, error: classArmError } = await admin
      .from("class_arms")
      .select("session_id")
      .eq("id", class_arm_id)
      .single();
    if (classArmError || !classArm) throw new Error("That class arm wasn't found");

    const userCode = `STU-${userId.slice(0, 8).toUpperCase()}`;
    const qrToken = generateQrToken(userCode);

    const { error: userError } = await admin.from("users").insert({
      id: userId,
      school_id: profile.school_id,
      role: "student",
      user_code: userCode,
      qr_token: qrToken,
      first_name,
      last_name,
      email
    });
    if (userError) throw new Error(userError.message);

    const { data: student, error: studentError } = await admin
      .from("students")
      .insert({
        user_id: userId,
        admission_number,
        current_class_arm_id: class_arm_id,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        enrollment_date: new Date().toISOString().slice(0, 10)
      })
      .select()
      .single();
    if (studentError) throw new Error(studentError.message);

    const { error: enrollError } = await admin.from("student_class_enrollments").insert({
      student_id: student.id,
      class_arm_id,
      session_id: classArm.session_id,
      status: "active"
    });
    if (enrollError) throw new Error(enrollError.message);

    return NextResponse.json({ student, user_code: userCode }, { status: 201 });
  } catch (err) {
    // Best-effort cleanup, same reasoning as school registration: don't leave
    // an orphaned login if a later step fails, so the same email can be retried.
    await admin.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : "Admission failed";
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
