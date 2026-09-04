/**
 * next-intl request-time configuration.
 * This runs on every request and loads the correct message bundle for the locale.
 */

import { getRequestConfig } from "next-intl/server";
import { siteConfig } from "@/config/site";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolvedLocale = siteConfig.locales.includes(locale as never)
    ? (locale as string)
    : siteConfig.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`@/messages/${resolvedLocale}.json`)).default,
  };
});
