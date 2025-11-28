import { Metadata } from 'next';
import { generateSoftwareApplicationSchema } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'AI Market Opportunities: Generate 9/10 Ideas Instantly',
  description:
    'Enter any topic → Get 4-6 scored product ideas with personas, pain points, monetization. Pro: Save + shippable prompts. Generate AI product opportunities from any market.',
  keywords: [
    'ai product ideas',
    'market opportunities ai',
    'startup validation',
    'ai product opportunity generator',
    'product discovery ai',
  ],
  openGraph: {
    title: 'AI Market Opportunities: Generate 9/10 Ideas Instantly',
    description:
      'Enter any topic → Get 4-6 scored product ideas with personas, pain points, monetization. Pro: Save + shippable prompts.',
    url: 'https://intellectra.kenawak.works/dashboard/market-opportunities',
  },
  alternates: {
    canonical: '/dashboard/market-opportunities',
  },
};

const structuredData = generateSoftwareApplicationSchema({
  name: 'Intellectra Market Opportunities',
  description:
    'AI-powered product opportunity discovery from any market topic. Generate 4-6 scored opportunities with personas, pain points, and monetization strategies.',
  applicationCategory: 'BusinessApplication',
  offers: {
    price: '29',
    priceCurrency: 'USD',
  },
  featureList: [
    'Topic-based opportunity generation',
    'Pro workspace saves',
    'Shippable starter prompts',
    'Market proof with concrete numbers',
    'Quantified pain points with metrics',
  ],
  url: 'https://intellectra.kenawak.works/dashboard/market-opportunities',
});

export default function MarketOpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={structuredData} />
      {children}
    </>
  );
}

