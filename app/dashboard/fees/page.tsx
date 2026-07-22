import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecordPaymentForm from "./record-payment-form";

export default async function FeesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  // Students land on their own payment history instead of the admin tools.
  if (profile?.role === "student") {
    return <StudentFeeHistory userId={user.id} />;
  }
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: recent } = await supabase
    .from("fee_payments")
    .select("receipt_number, amount, description, payment_date, students(admission_number, users(first_name, last_name))")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Fees</h1>
      <RecordPaymentForm />

      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <p className="border-b border-black/10 px-4 py-3 text-sm font-medium">Recent payments</p>
        <div className="divide-y divide-black/5">
          {(recent ?? []).map((p, i) => {
            const student = p.students as unknown as {
              admission_number: string;
              users: { first_name: string; last_name: string };
            };
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p>
                    {student?.users?.first_name} {student?.users?.last_name}{" "}
                    <span className="text-black/40">({student?.admission_number})</span>
                  </p>
                  <p className="text-black/50">{p.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{Number(p.amount).toLocaleString()}</p>
                  <p className="text-black/40">{p.receipt_number}</p>
                </div>
              </div>
            );
          })}
          {(recent ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-black/40">No payments recorded yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}

async function StudentFeeHistory({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: student } = await supabase.from("students").select("id").eq("user_id", userId).single();

  const { data: payments } = student
    ? await supabase
        .from("fee_payments")
        .select("id, receipt_number, amount, description, payment_date")
        .eq("student_id", student.id)
        .order("payment_date", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">My payments</h1>
      <div className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
        {(payments ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p>{p.description}</p>
              <p className="text-black/40">
                Paid {new Date(p.payment_date).toLocaleDateString()} · ₦{Number(p.amount).toLocaleString()}
              </p>
            </div>
            <a href={`/api/fee-payments/${p.id}/receipt`} className="text-brass underline">
              Receipt
            </a>
          </div>
        ))}
        {(payments ?? []).length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-black/40">No payments on record yet.</p>
        )}
      </div>
    </main>
  );
}
