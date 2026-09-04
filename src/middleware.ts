/**
 * Combined middleware:
 * 1. next-intl locale detection & routing
 * 2. Supabase session refresh (keeps auth cookies fresh on every request)
 */

import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

const intlMiddleware = createMiddleware({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  // Step 1: Run next-intl to handle locale routing
  const response = intlMiddleware(request);

  // Step 2: Refresh Supabase session cookies
  const supabase = createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getSession();

  return response;
}

export const config = {
  // Match all paths except static assets and API routes
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
