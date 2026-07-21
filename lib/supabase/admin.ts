import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A privileged Supabase client using the SERVICE ROLE key — this bypasses
 * Row Level Security entirely. Use it ONLY in server-side API routes for
 * actions that legitimately need to act before any user/role exists yet
 * (like school registration, where there's no admin row to authorize the
 * insert). NEVER import this in a Client Component, and NEVER prefix the
 * underlying env var with NEXT_PUBLIC_ — that would ship it to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
