import { NextResponse } from 'next/server';

/**
 * GET /api/sitemap
 * 
 * Generates XML sitemap for search engines
 */
export async function GET() {
  const baseUrl = 'https://intellectra.kenawak.works';
  const currentDate = new Date().toISOString().split('T')[0];

  const pages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/dashboard/market-opportunities', priority: '0.9', changefreq: 'weekly' },
    { url: '/dashboard/idea-validator', priority: '0.9', changefreq: 'weekly' },
    { url: '/dashboard/workspace', priority: '0.8', changefreq: 'weekly' },
    { url: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { url: '/login', priority: '0.5', changefreq: 'monthly' },
    { url: '/signup', priority: '0.5', changefreq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

