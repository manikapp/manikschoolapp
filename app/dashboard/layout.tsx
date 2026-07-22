import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, is_super_admin, schools(name)")
    .eq("id", user.id)
    .single();

  const schoolName = profile?.is_super_admin
    ? "ManikSchoolApp Platform"
    : (profile?.schools as unknown as { name: string })?.name ?? "ManikSchoolApp";
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "";

  return (
    <div className="flex min-h-screen bg-paper">
      <DashboardSidebar
        role={profile?.role ?? "student"}
        schoolName={schoolName}
        fullName={fullName}
        isSuperAdmin={profile?.is_super_admin ?? false}
      />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
