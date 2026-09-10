/**
 * Centralized environment variable access.
 * Every module that needs an env var imports from here — never reads process.env directly.
 * This file is the single source of truth for env var names, defaults, and validation.
 *
 * Build-safe: never throws. Missing values are logged and returned as empty strings so
 * the build can complete on Vercel even before secrets are configured.
 */

function read(name: string, fallback = ""): string {
  const value = process.env[name] ?? fallback;
  if (!value && !fallback && process.env.NODE_ENV !== "test" && typeof window === "undefined") {
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabase: {
    url:
      read("NEXT_PUBLIC_SUPABASE_URL") ||
      read("VITE_SUPABASE_URL"),
    anonKey:
      read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      read("VITE_SUPABASE_ANON_KEY"),
    serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  },
  site: {
    url: read("NEXT_PUBLIC_SITE_URL", "https://newsiq.top"),
  },
  ai: {
    openaiApiKey: read("OPENAI_API_KEY"),
    anthropicApiKey: read("ANTHROPIC_API_KEY"),
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
