import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLetterPdf } from "@/lib/pdf";
import { uploadDocument } from "@/lib/storage";

// GET /api/letters — list letters for the caller's school
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from("letters").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ letters: data });
}

// POST /api/letters — compose a letter, render it into the chosen letterhead as a PDF
// Body: { title, body, recipient, template_id? }
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("school_id, role, schools(name, address)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: { code: "forbidden", message: "Admin only" } }, { status: 403 });
  }

  const { title, body, recipient, template_id } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ error: { code: "validation", message: "title and body are required" } }, { status: 400 });
  }

  let config = undefined;
  if (template_id) {
    const { data: template } = await supabase
      .from("letterhead_templates")
      .select("style_config")
      .eq("id", template_id)
      .single();
    config = template?.style_config;
  }

  const school = profile.schools as unknown as { name: string; address: string | null };
  const pdfBuffer = generateLetterPdf({
    schoolName: school.name,
    schoolAddress: school.address,
    title,
    body,
    recipient,
    config
  });

  const path = `letters/${profile.school_id}-${Date.now()}.pdf`;
  const pdfUrl = await uploadDocument(supabase, path, pdfBuffer, "application/pdf");

  const { data: letter, error } = await supabase
    .from("letters")
    .insert({
      school_id: profile.school_id,
      template_id: template_id ?? null,
      title,
      body,
      recipient,
      pdf_url: pdfUrl,
      created_by: user.id
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ letter }, { status: 201 });
}
