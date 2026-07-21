import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/guardian-passes
// Body: { student_id, guardian_name, guardian_phone, relationship, valid_from, valid_to }
// Created by a parent for their own child, or by school staff on a parent's behalf.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const body = await request.json();
  const { student_id, guardian_name, guardian_phone, relationship, valid_from, valid_to } = body;

  if (!student_id || !guardian_name || !guardian_phone || !valid_from || !valid_to) {
    return NextResponse.json(
      { error: { code: "validation", message: "Missing required fields" } },
      { status: 400 }
    );
  }

  const { data: pass, error } = await supabase
    .from("guardian_passes")
    .insert({
      student_id,
      guardian_name,
      guardian_phone,
      relationship,
      valid_from,
      valid_to,
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ guardian_pass: pass }, { status: 201 });
}

// GET /api/guardian-passes?student_id=...
// Used by gate staff to verify a pass before releasing a student.
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json(
      { error: { code: "validation", message: "student_id is required" } },
      { status: 400 }
    );
  }

  const { data: passes, error } = await supabase
    .from("guardian_passes")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "pending")
    .order("valid_from", { ascending: false });

  if (error) {
    return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ guardian_passes: passes });
}
