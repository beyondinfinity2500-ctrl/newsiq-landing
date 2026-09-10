/**
 * Server-side Supabase client.
 * Uses cookie-based session management — respects the authenticated user's RLS context.
 * Import this only in Server Components, Route Handlers, and Server Actions.
 *
 * Graceful degradation: if Supabase credentials (url/anonKey) are not
 * configured, returns null. The app must check for null and operate
 * in limited mode without Supabase features.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export async function createSupabaseServerClient(): Promise<AnySupabaseClient> {
  if (!env.supabase.url || !env.supabase.anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The setAll method was called from a Server Component.
          // This can be ignored if middleware refreshes sessions.
        }
      },
    },
  });
}
