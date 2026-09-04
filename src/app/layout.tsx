import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "NewsIQ — The signal behind the headlines", template: "%s · NewsIQ" },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  alternates: { canonical: siteConfig.url },
  openGraph: { type: "website", siteName: siteConfig.name, title: "NewsIQ — The signal behind the headlines", description: siteConfig.description, url: siteConfig.url },
  twitter: { card: "summary_large_image", title: "NewsIQ — The signal behind the headlines", description: siteConfig.description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html suppressHydrationWarning><body className={`${inter.variable} ${notoArabic.variable} min-h-screen antialiased`}>{children}</body></html>;
}
