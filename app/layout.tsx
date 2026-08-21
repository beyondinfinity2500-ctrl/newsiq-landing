import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEWSiQ | Global News & Deep Financial Intelligence',
  description: 'AI-driven market impact analysis and real-time global news foresight before it hits mainstream markets.',
  metadataBase: new URL('https://www.newsiq.top'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NEWSiQ | Global News & Deep Financial Intelligence',
    description: 'Real-time global micro-news analysis powered by advanced AI.',
    url: 'https://www.newsiq.top',
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
