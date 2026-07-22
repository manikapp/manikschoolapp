import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrToken } from "@/lib/qr";

// GET /api/teachers — list
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id, staff_number, department, users(first_name, last_name, email, user_code)")
    .order("staff_number");
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ teachers: data });
}

// POST /api/teachers
// Body: { first_name, last_name, email, password, staff_number, department? }
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

  const { first_name, last_name, email, password, staff_number, department } = await request.json();
  if (!first_name || !last_name || !email || !password || !staff_number) {
    return NextResponse.json(
      { error: { code: "validation", message: "first_name, last_name, email, password, and staff_number are required" } },
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
      { error: { code: "auth_error", message: authError?.message ?? "Could not create the teacher's login" } },
      { status: 400 }
    );
  }
  const userId = authUser.user.id;

  try {
    const userCode = `TCH-${userId.slice(0, 8).toUpperCase()}`;
    const qrToken = generateQrToken(userCode);

    const { error: userError } = await admin.from("users").insert({
      id: userId,
      school_id: profile.school_id,
      role: "teacher",
      user_code: userCode,
      qr_token: qrToken,
      first_name,
      last_name,
      email
    });
    if (userError) throw new Error(userError.message);

    const { data: teacher, error: teacherError } = await admin
      .from("teachers")
      .insert({ user_id: userId, staff_number, department, hire_date: new Date().toISOString().slice(0, 10) })
      .select()
      .single();
    if (teacherError) throw new Error(teacherError.message);

    return NextResponse.json({ teacher, user_code: userCode }, { status: 201 });
  } catch (err) {
    await admin.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : "Could not add the teacher";
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
