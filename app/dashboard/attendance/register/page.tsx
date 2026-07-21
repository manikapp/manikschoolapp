import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AttendanceRegisterPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const today = new Date().toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("student_attendance")
    .select(
      "clock_in_time, clock_out_time, whatsapp_notified, students(admission_number, users(first_name, last_name))"
    )
    .eq("date", today)
    .order("clock_in_time", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Today's attendance register</h1>
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/50">
              <th className="px-4 py-2 font-normal">Student</th>
              <th className="px-4 py-2 font-normal">Clock in</th>
              <th className="px-4 py-2 font-normal">Clock out</th>
              <th className="px-4 py-2 font-normal">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row, i) => {
              const student = row.students as unknown as {
                admission_number: string;
                users: { first_name: string; last_name: string };
              };
              return (
                <tr key={i} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2">
                    {student?.users?.first_name} {student?.users?.last_name}{" "}
                    <span className="text-black/40">({student?.admission_number})</span>
                  </td>
                  <td className="px-4 py-2">
                    {row.clock_in_time ? new Date(row.clock_in_time).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {row.clock_out_time ? new Date(row.clock_out_time).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-2">{row.whatsapp_notified ? "Sent" : "—"}</td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-black/40">
                  No attendance recorded yet today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
