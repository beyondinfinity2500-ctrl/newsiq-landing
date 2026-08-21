import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  description: 'Short global news, financial market signals, and AI-assisted impact analysis across equities, currencies, commodities, energy, and crypto.',
  keywords: ['global news', 'financial markets', 'market impact analysis', 'AI news intelligence', 'short news', 'commodities', 'crypto markets', 'gold', 'oil', 'equities'],
  applicationName: 'NEWSiQ',
  authors: [{ name: 'NEWSiQ' }],
  creator: 'NEWSiQ',
  publisher: 'NEWSiQ',
  category: 'news',
  metadataBase: new URL('https://newsiq.top'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'fa-IR': '/?lang=fa',
    },
    types: {
      'application/rss+xml': 'https://newsiq.top/feed.xml',
    },
  },
  title: {
    default: 'NEWSiQ | Global News & Financial Intelligence',
    template: '%s | NEWSiQ',
  },
  openGraph: {
    description: 'Real-time global micro-news analysis powered by advanced AI.',
    url: 'https://newsiq.top',
    siteName: 'NEWSiQ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEWSiQ Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEWSiQ | Global Financial Intelligence',
    description: 'AI-driven market impact analysis and global news foresight.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="bg-background">
      <body className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
