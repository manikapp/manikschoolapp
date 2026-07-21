import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// GET /api/fee-payments?student_id=&term_id=
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");
  const termId = searchParams.get("term_id");

  if (!studentId) {
    return NextResponse.json(
      { error: { code: "validation", message: "student_id is required" } },
      { status: 400 }
    );
  }

  let query = supabase
    .from("fee_payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false });
  if (termId) query = query.eq("term_id", termId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ fee_payments: data });
}

// POST /api/fee-payments — admin records a payment that has already happened
// Body: { student_id, amount, description, term_id }
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }

  const body = await request.json();
  const { student_id, amount, description, term_id } = body;
  if (!student_id || !amount || !description || !term_id) {
    return NextResponse.json(
      { error: { code: "validation", message: "Missing required fields" } },
      { status: 400 }
    );
  }

  // Simple, readable receipt numbers: RCPT-<8 hex chars>. Uniqueness is enforced
  // at the DB level (receipt_number is unique), this just keeps it short.
  const receiptNumber = `RCPT-${randomUUID().split("-")[0].toUpperCase()}`;

  const { data, error } = await supabase
    .from("fee_payments")
    .insert({
      student_id,
      amount,
      description,
      term_id,
      receipt_number: receiptNumber,
      processed_by: user.id
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: { code: "server_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ fee_payment: data }, { status: 201 });
}
