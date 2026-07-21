import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/assessment-components — a school's configured CA/exam structure
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessment_components")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ assessment_components: data });
}

// POST /api/assessment-components — admin defines a component (e.g. "CA1", max_score 10)
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

  const { name, category, max_score, sort_order } = await request.json();
  if (!name || !max_score) {
    return NextResponse.json(
      { error: { code: "validation", message: "name and max_score are required" } },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("assessment_components")
    .insert({ school_id: profile.school_id, name, category: category ?? "ca", max_score, sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ assessment_component: data }, { status: 201 });
}
