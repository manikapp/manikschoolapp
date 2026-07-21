import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/exams/:id — exam detail with its questions
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: exam, error } = await supabase
    .from("exams")
    .select("*, subjects(name), class_arms(display_name), exam_questions(*)")
    .eq("id", params.id)
    .single();

  if (error || !exam) {
    return NextResponse.json({ error: { code: "not_found", message: "Exam not found" } }, { status: 404 });
  }
  return NextResponse.json({ exam });
}
