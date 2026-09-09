/**
 * Browser-side Supabase client.
 * Uses the anon key — subject to Row Level Security policies.
 * Import this only in Client Components ("use client").
 * 
 * Graceful degradation: if Supabase credentials (url/anonKey) are not
 * configured, returns null. The app will check for this and operate
 * in limited mode without Supabase features. This prevents the "Application
 * error: a client-side exception has occurred" error when Vercel environment
 * variables are missing.
 */

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export function createSupabaseBrowserClient() {
  // Check if required environment variables are configured
  const hasUrl = !!env.supabase.url;
  const hasAnonKey = !!env.supabase.anonKey;
  
  if (!hasUrl || !hasAnonKey) {
    // Return null if Supabase credentials are not configured
    // The app must check for null and operate in limited mode
    return null;
  }
  
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}