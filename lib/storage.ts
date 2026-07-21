import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "documents";

/**
 * Uploads a generated file (PDF buffer, SVG string, etc.) to the `documents`
 * bucket and returns its public URL. The bucket must exist and be public —
 * see the README's Storage setup step (one-time, done from the Supabase
 * dashboard since bucket creation isn't part of the SQL migrations).
 */
export async function uploadDocument(
  supabase: SupabaseClient,
  path: string,
  content: Buffer | string,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, content, {
    contentType,
    upsert: true
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
