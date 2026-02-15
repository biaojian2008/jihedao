/**
 * Server-side Supabase client (no cookie/session in MVP).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabase() {
  return createClient(url || "", key || "");
}
