import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/exams/:id/questions — add a question to an exam still in draft
// Body: { question_text, question_type, options?, correct_answer?, marks }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const body = await request.json();
  const { question_text, question_type, options, correct_answer, marks, sort_order } = body;
  if (!question_text) {
    return NextResponse.json({ error: { code: "validation", message: "question_text is required" } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("exam_questions")
    .insert({
      exam_id: params.id,
      question_text,
      question_type: question_type ?? "mcq",
      options,
      correct_answer,
      marks: marks ?? 1,
      sort_order: sort_order ?? 0
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ exam_question: data }, { status: 201 });
}
