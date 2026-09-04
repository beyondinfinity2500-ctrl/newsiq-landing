import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { footerNav, socialLinks } from "@/config/navigation";
import type { SiteLocale } from "@/config/site";

export async function AppFooter({ locale }: { locale: SiteLocale }) {
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm font-black tracking-tighter text-background">N</span>
              <span className="text-lg font-bold text-foreground">News<span className="text-info">IQ</span></span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          {/* Link sections */}
          {footerNav.map((section) => (
            <div key={section.titleKey}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(section.titleKey.split(".")[1])}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.key}>
                    <Link href={`/${locale}${link.href}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {navT(link.labelKey.split(".")[1])}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">{t("copyright")}</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a key={social.key} href={social.href} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
