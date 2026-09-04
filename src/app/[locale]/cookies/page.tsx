import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/cookies`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/cookies`])),
      ...{ "x-default": `${siteConfig.url}/en/cookies` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("cookies");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/privacy`, label: "Privacy Policy" },
        { href: `/${locale}/terms`, label: "Terms of Service" },
      ]}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

      <h2 className="mt-8 text-lg font-bold text-foreground">{t("what")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("whatBody")}</p>

      <h2 className="mt-8 text-lg font-bold text-foreground">{t("third")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("thirdBody")}</p>

      <h2 className="mt-8 text-lg font-bold text-foreground">{t("manage")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("manageBody")}</p>
    </StaticPageShell>
  );
}
