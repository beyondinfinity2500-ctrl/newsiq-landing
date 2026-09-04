/**
 * Server-side Supabase client.
 * Uses cookie-based session management — respects the authenticated user's RLS context.
 * Import this only in Server Components, Route Handlers, and Server Actions.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function createSupabaseServerClient() {
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
