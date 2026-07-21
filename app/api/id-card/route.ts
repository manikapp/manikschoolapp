import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { qrTokenToDataUrl } from "@/lib/qr";

// GET /api/id-card — returns the current user's ID card payload (see API
// reference doc, section 1: GET /users/:id/id-card).
export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("first_name, last_name, role, user_code, qr_token, photo_url, schools(name)")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: { code: "not_found", message: "Profile not found" } }, { status: 404 });
  }

  const qrDataUrl = await qrTokenToDataUrl(profile.qr_token);

  return NextResponse.json({
    school: (profile.schools as unknown as { name: string })?.name,
    full_name: `${profile.first_name} ${profile.last_name}`,
    role: profile.role,
    user_code: profile.user_code,
    photo_url: profile.photo_url,
    qr_data_url: qrDataUrl
  });
}
