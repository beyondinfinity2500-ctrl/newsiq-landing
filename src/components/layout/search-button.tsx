import Link from "next/link";
import { Search } from "lucide-react";
import type { SiteLocale } from "@/config/site";

export function SearchButton({ locale }: { locale: SiteLocale }) {
  return (
    <Link
      href={`/${locale}/search`}
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Search"
    >
      <Search size={16} aria-hidden="true" />
      <span className="hidden lg:inline">{/* placeholder text */}Search...</span>
    </Link>
  );
}
