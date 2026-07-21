import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStampSvg } from "@/lib/stamp";
import { uploadDocument } from "@/lib/storage";

// POST /api/school-stamps — admin generates (or regenerates) the school's digital stamp
export async function POST() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("school_id, role, schools(name)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: { code: "forbidden", message: "Admin only" } }, { status: 403 });
  }

  const schoolName = (profile.schools as unknown as { name: string })?.name ?? "School";
  const svg = generateStampSvg({ schoolName });
  const path = `stamps/${profile.school_id}-${Date.now()}.svg`;
  const imageUrl = await uploadDocument(supabase, path, svg, "image/svg+xml");

  const { data: stamp, error } = await supabase
    .from("school_stamps")
    .insert({ school_id: profile.school_id, image_url: imageUrl, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ school_stamp: stamp }, { status: 201 });
}

// GET /api/school-stamps — current stamp for the caller's school
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("school_stamps")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ school_stamp: data });
}
