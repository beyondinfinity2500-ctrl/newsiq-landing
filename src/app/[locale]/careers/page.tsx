import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";
import { Briefcase } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/careers`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/careers`])),
      ...{ "x-default": `${siteConfig.url}/en/careers` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("careers");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/about`, label: "About" },
        { href: `/${locale}/contact`, label: "Contact" },
      ]}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

      <h2 className="mt-8 text-lg font-bold text-foreground">{t("openRoles")}</h2>
      <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        <Briefcase className="mx-auto mb-2 size-6 opacity-60" aria-hidden="true" />
        {t("noRoles")}
      </div>

      <h2 className="mt-10 text-lg font-bold text-foreground">{t("values")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("valuesText")}</p>

      <h2 className="mt-10 text-lg font-bold text-foreground">{t("howWeHire")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("howWeHireText")}</p>
    </StaticPageShell>
  );
}
