
export default function JsonLd() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'NEWSiQ',
    url: 'https://www.newsiq.top',
    logo: 'https://www.newsiq.top/logo.svg',
    description: 'Global micro-news analysis platform providing real-time financial market intelligence.',
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
