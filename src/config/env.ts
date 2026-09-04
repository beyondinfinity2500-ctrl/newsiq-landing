/**
 * Centralized environment variable access.
 * Every module that needs an env var imports from here — never reads process.env directly.
 * This file is the single source of truth for env var names, defaults, and validation.
 */

function required(name: string, fallback = ""): string {
  const value = process.env[name] ?? fallback;
  if (!value && !fallback) {
    // Log a warning but don't crash — allows build without all vars set.
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabase: {
    url: required("VITE_SUPABASE_URL") || required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("VITE_SUPABASE_ANON_KEY") || required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  },
  site: {
    url: required("NEXT_PUBLIC_SITE_URL", "https://newsiq.top"),
  },
  ai: {
    openaiApiKey: required("OPENAI_API_KEY"),
    anthropicApiKey: required("ANTHROPIC_API_KEY"),
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
