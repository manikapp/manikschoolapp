import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, clockOutMessage } from "@/lib/notifications";

// POST /api/attendance/clock-out
// Body: { user_code: string }
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { user_code } = await request.json();
  if (!user_code) {
    return NextResponse.json(
      { error: { code: "validation", message: "user_code is required" } },
      { status: 400 }
    );
  }

  const { data: studentUser, error: lookupError } = await supabase
    .from("users")
    .select("id, first_name, last_name, students(id, student_guardians(is_primary_contact, guardians(phone)))")
    .eq("user_code", user_code)
    .eq("role", "student")
    .single();

  if (lookupError || !studentUser) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No student found for that ID" } },
      { status: 404 }
    );
  }

  const student = (studentUser.students as unknown as { id: string; student_guardians: any[] }[])?.[0];
  if (!student) {
    return NextResponse.json(
      { error: { code: "not_found", message: "That user isn't registered as a student" } },
      { status: 404 }
    );
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Check for an active guardian pass covering right now — if someone other
  // than a parent is picking the student up, this is what the gate is verifying.
  const { data: activePass } = await supabase
    .from("guardian_passes")
    .select("id, guardian_name, status")
    .eq("student_id", student.id)
    .eq("status", "pending")
    .lte("valid_from", now.toISOString())
    .gte("valid_to", now.toISOString())
    .maybeSingle();

  const { data: attendanceRow, error: updateError } = await supabase
    .from("student_attendance")
    .update({
      clock_out_time: now.toISOString(),
      guardian_pass_id: activePass?.id ?? null
    })
    .eq("student_id", student.id)
    .eq("date", today)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: { code: "server_error", message: updateError.message } },
      { status: 500 }
    );
  }

  if (activePass) {
    await supabase.from("guardian_passes").update({ status: "used" }).eq("id", activePass.id);
  }

  const primaryGuardian = student.student_guardians?.find((g: any) => g.is_primary_contact);
  if (primaryGuardian?.guardians?.phone) {
    await sendWhatsAppMessage(
      primaryGuardian.guardians.phone,
      clockOutMessage(`${studentUser.first_name} ${studentUser.last_name}`, now.toLocaleTimeString())
    );
  }

  return NextResponse.json({
    attendance: attendanceRow,
    picked_up_via_guardian_pass: activePass ? { name: activePass.guardian_name } : null
  });
}
