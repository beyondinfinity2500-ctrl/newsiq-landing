import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "advertising" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/advertising`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/advertising`])),
      ...{ "x-default": `${siteConfig.url}/en/advertising` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function AdvertisingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("advertising");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/about`, label: "About" },
        { href: `/${locale}/contact`, label: "Contact" },
        { href: `/${locale}/editorial-policy`, label: "Editorial Policy" },
      ]}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

      <h2 className="mt-8 text-lg font-bold text-foreground">{t("formats")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("formatsText")}</p>

      <h2 className="mt-10 text-lg font-bold text-foreground">{t("guidelines")}</h2>
      <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
        <li>No ads for products or services we would not use ourselves.</li>
        <li>No ads that mislead the reader or impersonate editorial content.</li>
        <li>No tracking pixels, retargeting, or third-party data brokers.</li>
        <li>No ads targeted to readers under 18.</li>
      </ul>

      <p className="mt-10 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t("contact")}
      </p>
    </StaticPageShell>
  );
}
