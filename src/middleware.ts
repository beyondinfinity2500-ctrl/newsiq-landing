/**
 * Combined middleware:
 * 1. next-intl locale detection & routing
 * 2. Supabase session refresh (keeps auth cookies fresh on every request)
 * 3. Soft redirect for protected `/[locale]/admin/*` routes when the user is
 *    not authenticated. The authoritative role check still happens at the
 *    page level (via `requireEditor` / `requireSuperAdmin`) — this is just
 *    defense in depth and an early redirect to save a DB query.
 */

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

const intlMiddleware = createMiddleware({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

const PROTECTED_PREFIX = "/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // `getUser` validates the session against Supabase Auth, unlike `getSession`
  // which only decodes the cookie. This prevents trivial cookie tampering.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Step 3: Soft redirect for unauthenticated visitors to /<locale>/admin/*
  // The pathname is already locale-prefixed by next-intl.
  if (!user) {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0] ?? "";
    const isLocale = (siteConfig.locales as readonly string[]).includes(first);
    const rest = isLocale ? segments.slice(1) : segments;
    if (rest[0] === PROTECTED_PREFIX.slice(1)) {
      const locale = isLocale ? first : siteConfig.defaultLocale;
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Carry over any cookies set by the session refresh above
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  // Match all paths except static assets and API routes
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
