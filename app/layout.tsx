import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Newsiq - Smart Global News Analysis & Market Insights',
  description: 'Access real-time global news analysis and high-impact insights before they hit mainstream markets. Join the VIP waitlist for 50% off.',
  openGraph: {
    title: 'Newsiq - Smart Global News Analysis',
    description: 'The foresight that creates wealth. Join the waitlist for early access.',
    url: 'https://newsiq.top',
    siteName: 'Newsiq',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
