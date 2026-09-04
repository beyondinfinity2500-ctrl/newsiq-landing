/**
 * Central navigation configuration.
 * Route keys are locale-agnostic; the path is prefixed with [locale] at render time.
 */

export interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  icon?: string;
}

export const mainNav: NavItem[] = [
  { key: "home", labelKey: "nav.home", href: "/" },
  { key: "breaking", labelKey: "nav.breaking", href: "/breaking" },
  { key: "trending", labelKey: "nav.trending", href: "/trending" },
  { key: "markets", labelKey: "nav.markets", href: "/markets" },
  { key: "categories", labelKey: "nav.categories", href: "/categories" },
];

export interface FooterSection {
  titleKey: string;
  links: NavItem[];
}

export const footerNav: FooterSection[] = [
  {
    titleKey: "footer.company",
    links: [
      { key: "about", labelKey: "nav.about", href: "/about" },
      { key: "contact", labelKey: "nav.contact", href: "/contact" },
      { key: "careers", labelKey: "nav.careers", href: "/careers" },
      { key: "advertising", labelKey: "nav.advertising", href: "/advertising" },
    ],
  },
  {
    titleKey: "footer.legal",
    links: [
      { key: "privacy", labelKey: "nav.privacy", href: "/privacy" },
      { key: "terms", labelKey: "nav.terms", href: "/terms" },
      { key: "cookies", labelKey: "nav.cookies", href: "/cookies" },
    ],
  },
  {
    titleKey: "footer.editorial",
    links: [
      { key: "editorial-policy", labelKey: "nav.editorialPolicy", href: "/editorial-policy" },
      { key: "source-policy", labelKey: "nav.sourcePolicy", href: "/source-policy" },
    ],
  },
];

export const socialLinks = [
  { key: "x", label: "X", href: "https://x.com/newsiq" },
  { key: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/newsiq" },
  { key: "telegram", label: "Telegram", href: "https://t.me/newsiq" },
];
