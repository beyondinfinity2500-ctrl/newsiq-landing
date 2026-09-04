import type { MetadataRoute } from 'next'

const baseUrl = 'https://newsiq.top'

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date('2026-08-21T00:00:00.000Z')

  return [
    { url: `${baseUrl}/`, lastModified: updated, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/markets`, lastModified: updated, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/subscribe`, lastModified: updated, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: updated, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
