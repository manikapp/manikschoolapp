import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/exams/:id/status
// Body: { action: "submit" | "approve" | "publish" }
// Maps to the three separate endpoints in the API reference doc — combined here
// into one route with an action parameter, since they share the same guard logic.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { action } = await request.json();
  const { data: profile } = await supabase
    .from("users")
    .select("role, teachers(id), admins(id)")
    .eq("id", user.id)
    .single();

  const { data: exam } = await supabase.from("exams").select("status, teacher_id").eq("id", params.id).single();
  if (!exam) {
    return NextResponse.json({ error: { code: "not_found", message: "Exam not found" } }, { status: 404 });
  }

  const teacher = (profile?.teachers as unknown as { id: string }[])?.[0];
  const admin = (profile?.admins as unknown as { id: string }[])?.[0];

  let nextStatus: string;
  if (action === "submit") {
    if (exam.status !== "draft" || teacher?.id !== exam.teacher_id) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "Only the owning teacher can submit a draft exam" } },
        { status: 403 }
      );
    }
    nextStatus = "pending_review";
  } else if (action === "approve") {
    if (exam.status !== "pending_review" || !admin) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "Only an admin can approve a pending exam" } },
        { status: 403 }
      );
    }
    nextStatus = "approved";
  } else if (action === "publish") {
    if (exam.status !== "approved" || !admin) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "Only an admin can publish an approved exam" } },
        { status: 403 }
      );
    }
    nextStatus = "published";
  } else {
    return NextResponse.json(
      { error: { code: "validation", message: "action must be submit, approve, or publish" } },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = { status: nextStatus };
  if (action === "approve") updatePayload.approved_by = admin!.id;

  const { data, error } = await supabase
    .from("exams")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ exam: data });
}
