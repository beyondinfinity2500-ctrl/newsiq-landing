import type { Metadata } from "next";
import { siteConfig, type SiteLocale } from "@/config/site";

export function localizedUrl(locale: SiteLocale, path = ""): string {
  const cleanPath = path.replace(/^\//, "");
  return `${siteConfig.url}/${locale}${cleanPath ? `/${cleanPath}` : ""}`;
}

export function articleMetadata({
  locale,
  title,
  description,
  path,
  image,
}: {
  locale: SiteLocale;
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = localizedUrl(locale, path);
  const languages = Object.fromEntries(
    siteConfig.locales.map((item) => [item, localizedUrl(item, path)]),
  );

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      locale,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
