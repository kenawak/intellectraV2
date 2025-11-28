/**
 * SEO Utilities
 * 
 * Schema.org structured data and metadata generation for AI-first SEO/GEO
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
}

export interface SoftwareApplicationSchema {
  name: string;
  description: string;
  applicationCategory: string;
  offers: {
    price: string;
    priceCurrency: string;
  };
  featureList: string[];
  url?: string;
}

/**
 * Generate SoftwareApplication schema for a page
 */
export function generateSoftwareApplicationSchema(
  schema: SoftwareApplicationSchema
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: schema.name,
    description: schema.description,
    applicationCategory: schema.applicationCategory,
    offers: {
      '@type': 'Offer',
      price: schema.offers.price,
      priceCurrency: schema.offers.priceCurrency,
    },
    featureList: schema.featureList,
    url: schema.url || 'https://intellectra.kenawak.works',
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Intellectra',
    url: 'https://intellectra.kenawak.works',
    description: 'AI-powered product discovery and validation platform',
    sameAs: [
      // Add social media links if available
    ],
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Intellectra',
    url: 'https://intellectra.kenawak.works',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://intellectra.kenawak.works/dashboard/market-opportunities?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Default metadata for pages
 */
export const defaultMetadata: PageMetadata = {
  title: 'Intellectra: AI Product Discovery → Ship in Days',
  description:
    'Generate validated AI product opportunities from any market topic. Pro features: Save to workspace, shippable starter prompts.',
  keywords: [
    'ai product opportunity generator',
    'startup idea validator ai',
    'market analysis ai tool',
    'ship ai saas product',
    'ai saas boilerplate prompts',
  ],
};

