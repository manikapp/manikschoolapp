import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, teacherClockMessage } from "@/lib/notifications";

// POST /api/teacher-attendance
// Body: { action: "clock-in" | "clock-out" } — teacher acts on their own record only
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { action } = await request.json();
  if (action !== "clock-in" && action !== "clock-out") {
    return NextResponse.json(
      { error: { code: "validation", message: "action must be clock-in or clock-out" } },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, school_id, teachers(id)")
    .eq("id", user.id)
    .single();

  const teacher = (profile?.teachers as unknown as { id: string }[])?.[0];
  if (!teacher) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Only teachers can clock in/out" } },
      { status: 403 }
    );
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const { data: row, error } =
    action === "clock-in"
      ? await supabase
          .from("teacher_attendance")
          .upsert(
            { teacher_id: teacher.id, date: today, time_in: now.toISOString() },
            { onConflict: "teacher_id,date" }
          )
          .select()
          .single()
      : await supabase
          .from("teacher_attendance")
          .update({ time_out: now.toISOString() })
          .eq("teacher_id", teacher.id)
          .eq("date", today)
          .select()
          .single();

  if (error) {
    return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  }

  // Notify every admin in the school.
  const { data: admins } = await supabase
    .from("users")
    .select("phone")
    .eq("school_id", profile!.school_id)
    .eq("role", "admin");

  const message = teacherClockMessage(
    `${profile!.first_name} ${profile!.last_name}`,
    action === "clock-in" ? "in" : "out",
    now.toLocaleTimeString()
  );
  for (const admin of admins ?? []) {
    if (admin.phone) await sendWhatsAppMessage(admin.phone, message);
  }

  return NextResponse.json({ teacher_attendance: row });
}
