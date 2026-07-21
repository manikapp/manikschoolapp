import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/fee-clearance/:user_code
// Gate check — returns only a cleared/owing flag, never the amount (privacy,
// per the design doc's Fee Clearance module: staff at the gate shouldn't see
// financial detail, just whether to let the student through).
export async function GET(_request: Request, { params }: { params: { user_code: string } }) {
  const supabase = createClient();

  const { data: studentUser, error: lookupError } = await supabase
    .from("users")
    .select("first_name, last_name, school_id, students(id, current_class_arm_id, class_arms(level))")
    .eq("user_code", params.user_code)
    .eq("role", "student")
    .single();

  if (lookupError || !studentUser) {
    return NextResponse.json({ error: { code: "not_found", message: "No student found for that ID" } }, { status: 404 });
  }

  const student = (studentUser.students as unknown as {
    id: string;
    class_arms: { level: string } | null;
  }[])?.[0];

  if (!student) {
    return NextResponse.json(
      { error: { code: "not_found", message: "That user isn't registered as a student" } },
      { status: 404 }
    );
  }

  const { data: currentTerm } = await supabase
    .from("terms")
    .select("id, session_id, academic_sessions!inner(school_id)")
    .eq("is_current", true)
    .eq("academic_sessions.school_id", studentUser.school_id)
    .single();

  if (!currentTerm) {
    return NextResponse.json(
      { error: { code: "server_error", message: "No current term is set for this school" } },
      { status: 500 }
    );
  }

  const level = student.class_arms?.level;
  const [{ data: structures }, { data: payments }] = await Promise.all([
    supabase.from("fee_structures").select("amount").eq("term_id", currentTerm.id).eq("level", level ?? ""),
    supabase.from("fee_payments").select("amount").eq("student_id", student.id).eq("term_id", currentTerm.id)
  ]);

  const expected = (structures ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const paid = (payments ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const cleared = paid >= expected;

  return NextResponse.json({
    student_name: `${studentUser.first_name} ${studentUser.last_name}`,
    status: cleared ? "cleared" : "owing"
    // Deliberately no amount fields here — see the comment above.
  });
}
