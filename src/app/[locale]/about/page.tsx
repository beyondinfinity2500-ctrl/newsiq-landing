import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/about`,
      languages: Object.fromEntries(
        siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/about`]),
      ),
      ...{ "x-default": `${siteConfig.url}/en/about` },
    },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("subtitle"),
      url: `${siteConfig.url}/${locale}/about`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/contact`, label: "Contact" },
        { href: `/${locale}/careers`, label: "Careers" },
        { href: `/${locale}/editorial-policy`, label: "Editorial Policy" },
        { href: `/${locale}/source-policy`, label: "Source Policy" },
        { href: `/${locale}/markets`, label: "Markets" },
        { href: `/${locale}/subscribe`, label: "Pricing" },
      ]}
    >
      <p className="text-base leading-relaxed text-foreground">{t("lead")}</p>

      <h2 className="mt-10 text-2xl font-bold text-foreground">{t("mission")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("missionText")}</p>

      <h2 className="mt-10 text-2xl font-bold text-foreground">{t("howItWorks")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("howItWorksText")}</p>

      <h2 className="mt-10 text-2xl font-bold text-foreground">{t("principlesTitle")}</h2>
      <ul className="mt-4 space-y-3 list-disc ps-5 text-sm text-muted-foreground">
        <li>{t("principles.sourcing")}</li>
        <li>{t("principles.languages")}</li>
        <li>{t("principles.ai")}</li>
        <li>{t("principles.markets")}</li>
        <li>{t("principles.corrections")}</li>
      </ul>

      <p className="mt-10 rounded-xl border border-border bg-muted/30 p-4 text-sm italic text-muted-foreground">
        {t("team")}
      </p>
    </StaticPageShell>
  );
}
