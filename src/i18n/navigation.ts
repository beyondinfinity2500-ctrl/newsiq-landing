/**
 * Locale-aware navigation helpers for use outside Server Components.
 *
 * `Link` automatically prefixes the current locale, so the rest of the
 * codebase can write `href="/about"` and have it resolve to `/en/about`
 * (or whatever locale is active) at render time.
 *
 * `redirect` does the same for server actions and server components.
 */

import { createNavigation } from "next-intl/navigation";
import { siteConfig } from "@/config/site";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always",
});
