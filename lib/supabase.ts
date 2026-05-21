import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key.
// Bypasses RLS — use only in API routes, never expose to the client.
// Using `any` for the generic — we don't have generated types and
// service role operations need to work without schema validation.
let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _supabase;
}
