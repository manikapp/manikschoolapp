import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, clockInMessage } from "@/lib/notifications";

// POST /api/attendance/clock-in
// Body: { user_code: string } — the scanned/typed student ID (see API reference doc, section 3)
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

  // Resolve the scanned code to a student + their primary guardian.
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

  const { data: attendanceRow, error: upsertError } = await supabase
    .from("student_attendance")
    .upsert(
      {
        student_id: student.id,
        date: now.toISOString().slice(0, 10),
        clock_in_time: now.toISOString(),
        clocked_in_by: user.id,
        method: "manual"
      },
      { onConflict: "student_id,date" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json(
      { error: { code: "server_error", message: upsertError.message } },
      { status: 500 }
    );
  }

  // Notify the primary guardian (fire-and-forget style — don't block the
  // teacher's scan flow on WhatsApp's response time).
  const primaryGuardian = student.student_guardians?.find((g: any) => g.is_primary_contact);
  if (primaryGuardian?.guardians?.phone) {
    const sent = await sendWhatsAppMessage(
      primaryGuardian.guardians.phone,
      clockInMessage(`${studentUser.first_name} ${studentUser.last_name}`, now.toLocaleTimeString())
    );
    if (sent) {
      await supabase
        .from("student_attendance")
        .update({ whatsapp_notified: true })
        .eq("id", attendanceRow.id);
    }
  }

  return NextResponse.json({ attendance: attendanceRow });
}
