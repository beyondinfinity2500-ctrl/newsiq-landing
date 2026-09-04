import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const rtfCache: Record<string, Intl.RelativeTimeFormat> = {};

function getRtf(locale: string): Intl.RelativeTimeFormat {
  const key = locale;
  if (!rtfCache[key]) {
    rtfCache[key] = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  }
  return rtfCache[key];
}

export function formatRelativeTime(isoDate: string | null, locale: string): string {
  if (!isoDate) return "";
  const diff = new Date(isoDate).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const minutes = Math.round(diff / 60_000);
  const hours = Math.round(diff / 3_600_000);
  const days = Math.round(diff / 86_400_000);

  const rtf = getRtf(locale);
  if (absDiff < 3_600_000) return rtf.format(minutes, "minute");
  if (absDiff < 86_400_000) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}
