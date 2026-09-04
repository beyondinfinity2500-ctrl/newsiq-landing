/**
 * Admin/Service-role Supabase client.
 * Uses the service role key — BYPASSES Row Level Security entirely.
 *
 * SECURITY: This client must NEVER be imported by any code that runs in the browser.
 * Only use in Server Actions, Route Handlers, or Edge Functions that require
 * privileged access (admin operations, AI processing, system tasks).
 *
 * All mutations through this client must include their own authorization checks
 * since RLS will not protect you here.
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

export function createSupabaseAdminClient() {
  if (!env.supabase.serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin client requires the service role key.",
    );
  }

  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
