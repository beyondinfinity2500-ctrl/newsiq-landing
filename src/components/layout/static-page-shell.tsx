/**
 * Reusable shell for static / informational pages (about, contact, terms,
 * privacy, etc.). All of these pages share the same structure: a hero
 * header, a long-form body, and a sidebar of related links.
 *
 * Keeping the markup here means every page stays visually consistent and
 * the localized strings stay in one place per file.
 */

import type { ReactNode } from "react";
import { Link } from "@/i18n";
import { ArrowRight } from "lucide-react";

// next-intl exposes its locale-aware Link via the i18n/navigation module.
// We re-export from there so every static page imports the same component.
export { Link } from "@/i18n";

export interface StaticPageProps {
  locale: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional: small note rendered at the top of the body (e.g. "Last updated"). */
  meta?: ReactNode;
  /** Optional: related links shown in the sidebar. */
  relatedLinks?: Array<{ href: string; label: string }>;
}

export function StaticPageShell({ locale, title, subtitle, children, meta, relatedLinks }: StaticPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
      <Link
        href={`/${locale}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        Back
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        )}
        {meta && <div className="mt-3 text-xs text-muted-foreground">{meta}</div>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
        <article className="prose prose-sm max-w-none text-foreground">
          {children}
        </article>

        {relatedLinks && relatedLinks.length > 0 && (
          <aside className="space-y-2 lg:sticky lg:top-20 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Related
            </p>
            <ul className="space-y-1.5">
              {relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
