import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClearanceChecker from "./clearance-checker";

export default async function ClearancePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "teacher") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Fee clearance check</h1>
      <ClearanceChecker />
    </main>
  );
}
