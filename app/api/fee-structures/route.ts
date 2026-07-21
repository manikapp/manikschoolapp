import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/fee-structures?term_id=&level=
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const termId = searchParams.get("term_id");
  const level = searchParams.get("level");

  let query = supabase.from("fee_structures").select("*");
  if (termId) query = query.eq("term_id", termId);
  if (level) query = query.eq("level", level);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ fee_structures: data });
}

// POST /api/fee-structures — admin only (enforced by RLS as well as this check)
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const body = await request.json();
  const { school_id, level, term_id, amount, description } = body;
  if (!school_id || !level || !term_id || !amount || !description) {
    return NextResponse.json(
      { error: { code: "validation", message: "Missing required fields" } },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fee_structures")
    .insert({ school_id, level, term_id, amount, description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ fee_structure: data }, { status: 201 });
}
