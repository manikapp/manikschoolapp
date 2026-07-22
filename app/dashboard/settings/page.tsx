import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, email, user_code, schools(name)")
    .eq("id", user.id)
    .single();

  const rows = [
    { label: "Name", value: `${profile?.first_name} ${profile?.last_name}` },
    { label: "Email", value: profile?.email },
    { label: "Role", value: profile?.role },
    { label: "User code", value: profile?.user_code },
    { label: "School", value: (profile?.schools as unknown as { name: string })?.name }
  ];

  return (
    <main className="mx-auto max-w-xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Settings</h1>
      <div className="mt-6 divide-y divide-ink/10 rounded-lg bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-ink/50">{r.label}</span>
            <span className="font-mono">{r.value}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
