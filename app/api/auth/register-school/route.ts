import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrToken } from "@/lib/qr";

// POST /api/auth/register-school
// Body: { school_name, school_address?, school_phone?, school_email?,
//         admin_first_name, admin_last_name, admin_email, admin_password }
//
// Creates a new school and its first admin in one step — the self-service
// onboarding path. Everything after the first admin (teachers, students) goes
// through the admin-only "add user" flow instead, since those roles need to be
// assigned by someone with authority to vouch for them, not self-selected.
export async function POST(request: Request) {
  const body = await request.json();
  const {
    school_name,
    school_address,
    school_phone,
    school_email,
    admin_first_name,
    admin_last_name,
    admin_email,
    admin_password
  } = body;

  if (!school_name || !admin_first_name || !admin_last_name || !admin_email || !admin_password) {
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message: "school_name, admin_first_name, admin_last_name, admin_email, and admin_password are required"
        }
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Step 1: create the auth user, pre-confirmed (no email verification step —
  // this is the trade-off of a fast self-service flow; add real email
  // verification before this is exposed to the public internet unmoderated).
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: admin_email,
    password: admin_password,
    email_confirm: true
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: { code: "auth_error", message: authError?.message ?? "Could not create account" } },
      { status: 400 }
    );
  }

  const userId = authUser.user.id;

  try {
    // Step 2: create the school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({ name: school_name, address: school_address, phone: school_phone, email: school_email })
      .select()
      .single();
    if (schoolError) throw new Error(schoolError.message);

    // Step 3: create the users row (role = admin) linking auth user to the school
    const userCode = `ADM-${userId.slice(0, 8).toUpperCase()}`;
    const qrToken = generateQrToken(userCode);

    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      school_id: school.id,
      role: "admin",
      user_code: userCode,
      qr_token: qrToken,
      first_name: admin_first_name,
      last_name: admin_last_name,
      email: admin_email
    });
    if (userError) throw new Error(userError.message);

    // Step 4: the admins role-extension row
    const { error: adminError } = await supabase.from("admins").insert({ user_id: userId, position: "Administrator" });
    if (adminError) throw new Error(adminError.message);

    return NextResponse.json({ school, user_code: userCode }, { status: 201 });
  } catch (err) {
    // Best-effort cleanup: if anything after auth-user creation fails, remove
    // the orphaned auth user so the same email can be retried cleanly instead
    // of being permanently stuck as "already registered."
    await supabase.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
