/**
 * Centralized environment variable access.
 * Every module that needs an env var imports from here — never reads process.env directly.
 * This file is the single source of truth for env var names, defaults, and validation.
 *
 * Build-safe: never throws. Missing or invalid values are logged and returned as empty
 * strings so the build can complete on Vercel even before secrets are configured.
 */

function read(name: string, fallback = ""): string {
  const value = process.env[name] ?? fallback;
  if (!value && !fallback && process.env.NODE_ENV !== "test" && typeof window === "undefined") {
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

function readUrl(...names: string[]): string {
  for (const name of names) {
    const raw = read(name);
    if (raw) {
      try {
        const parsed = new URL(raw);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") return raw;
      } catch { /* invalid URL — fall through */ }
      if (typeof window === "undefined") {
        console.warn(`[env] Ignoring invalid URL in ${name}: "${raw.slice(0, 60)}"`);
      }
    }
  }
  return "";
}

function readKey(...names: string[]): string {
  for (const name of names) {
    const raw = read(name);
    if (raw && raw !== "undefined" && raw !== "null") return raw;
  }
  return "";
}

export const env = {
  supabase: {
    url: readUrl("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"),
    anonKey: readKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
    serviceRoleKey: readKey("SUPABASE_SERVICE_ROLE_KEY"),
  },
  site: {
    url: read("NEXT_PUBLIC_SITE_URL", "https://newsiq.top"),
  },
  ai: {
    openaiApiKey: readKey("OPENAI_API_KEY"),
    anthropicApiKey: readKey("ANTHROPIC_API_KEY"),
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
