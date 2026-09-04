import { siteConfig } from "@/config/site";

export function organizationJsonLd() { return { "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url }; }
export function newsArticleJsonLd(article: { headline: string; description: string; url: string; datePublished: string; image?: string }) { return { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.headline, description: article.description, url: article.url, datePublished: article.datePublished, image: article.image ? [article.image] : undefined, publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url } }; }
