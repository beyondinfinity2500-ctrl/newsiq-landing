/**
 * Browser-side Supabase client.
 * Uses the anon key — subject to Row Level Security policies.
 * Import this only in Client Components ("use client").
 */

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
