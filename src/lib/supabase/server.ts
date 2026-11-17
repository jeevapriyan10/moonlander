import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./client";

/**
 * Returns a server-side Supabase client for Route Handlers and background verification.
 * Uses SUPABASE_SERVICE_ROLE_KEY when available to bypass RLS for verified writes,
 * or falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
