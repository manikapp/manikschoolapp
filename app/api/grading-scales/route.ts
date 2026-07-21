import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/grading-scales?level_group=junior|senior
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const levelGroup = searchParams.get("level_group");

  let query = supabase.from("grading_scales").select("*").order("min_score", { ascending: false });
  if (levelGroup) query = query.eq("level_group", levelGroup);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ grading_scales: data });
}

// POST /api/grading-scales — admin defines a grade band (e.g. 75-100 -> "A1")
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

  const { level_group, min_score, max_score, grade, remark, grade_point } = await request.json();
  if (!level_group || min_score === undefined || max_score === undefined || !grade) {
    return NextResponse.json(
      { error: { code: "validation", message: "level_group, min_score, max_score, and grade are required" } },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("grading_scales")
    .insert({ school_id: profile.school_id, level_group, min_score, max_score, grade, remark, grade_point })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ grading_scale: data }, { status: 201 });
}
