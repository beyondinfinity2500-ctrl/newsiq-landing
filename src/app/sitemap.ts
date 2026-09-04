import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteConfig.locales.map((locale) => ({ url: `${siteConfig.url}/${locale}`, lastModified: new Date(), changeFrequency: "hourly", priority: locale === siteConfig.defaultLocale ? 1 : 0.9 }));
}
