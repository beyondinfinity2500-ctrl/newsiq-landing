
export default function JsonLd() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsMediaOrganization',
        '@id': 'https://newsiq.top/#organization',
        name: 'NEWSiQ',
        url: 'https://newsiq.top',
        logo: 'https://newsiq.top/logo.svg',
        description: 'Global news intelligence and financial market impact analysis.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://newsiq.top/#website',
        name: 'NEWSiQ | Global News & Financial Intelligence',
        url: 'https://newsiq.top',
        publisher: { '@id': 'https://newsiq.top/#organization' },
        inLanguage: 'en',
      },
      {
        '@type': 'NewsArticle',
        '@id': 'https://newsiq.top/#hormuz-briefing',
        headline: 'Strait of Hormuz remains closed as tensions rise alongside diplomatic efforts',
        description: 'Context analysis of the Strait of Hormuz closure and potential effects across energy, precious metals, bitcoin, equities, currencies, and grains.',
        datePublished: '2026-08-21T00:00:00.000Z',
        dateModified: '2026-08-21T00:00:00.000Z',
        author: { '@type': 'Organization', name: 'NEWSiQ Context Desk' },
        publisher: { '@id': 'https://newsiq.top/#organization' },
        mainEntityOfPage: 'https://newsiq.top/',
        keywords: 'Strait of Hormuz, oil markets, gold, bitcoin, grains',
        isAccessibleForFree: true,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
