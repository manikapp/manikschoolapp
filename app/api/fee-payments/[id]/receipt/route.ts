import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/fee-payments/:id/receipt
// Returns receipt data as JSON for now — rendering it to an actual downloadable
// PDF (matching the school's letterhead) belongs with the Documents module,
// which shares the same PDF-rendering approach for letters/result sheets/stamps.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: payment, error } = await supabase
    .from("fee_payments")
    .select(
      "receipt_number, amount, description, payment_date, students(admission_number, users(first_name, last_name, schools(name, address)))"
    )
    .eq("id", params.id)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: { code: "not_found", message: "Receipt not found" } }, { status: 404 });
  }

  return NextResponse.json({ receipt: payment });
}
