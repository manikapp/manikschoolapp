import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceScanner from "./attendance-scanner";

export default async function AttendancePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Student attendance</h1>
      <AttendanceScanner />
    </main>
  );
}
