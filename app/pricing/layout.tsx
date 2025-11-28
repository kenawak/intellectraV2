import { Metadata } from 'next';
import { generateSoftwareApplicationSchema } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'Pro: Unlimited Saves + Shippable Prompts | $29/mo',
  description:
    'Pro plan unlocks workspace saves, complete starter prompts, and faster MVP shipping. Start 7-day free trial.',
  keywords: [
    'ai saas pricing',
    'product discovery pro',
    'startup tools pricing',
    'ai saas subscription',
  ],
  openGraph: {
    title: 'Pro: Unlimited Saves + Shippable Prompts | $29/mo',
    description:
      'Pro plan unlocks workspace saves, complete starter prompts, and faster MVP shipping.',
    url: 'https://intellectra.kenawak.works/pricing',
  },
  alternates: {
    canonical: '/pricing',
  },
};

const structuredData = generateSoftwareApplicationSchema({
  name: 'Intellectra Pro',
  description:
    'Pro plan with unlimited workspace saves, complete starter prompts, and faster MVP shipping. $29/month.',
  applicationCategory: 'BusinessApplication',
  offers: {
    price: '29',
    priceCurrency: 'USD',
  },
  featureList: [
    'Unlimited workspace saves',
    'Complete starter prompts',
    'Faster MVP shipping',
    'Market opportunities access',
    'Idea validator access',
  ],
  url: 'https://intellectra.kenawak.works/pricing',
});

export default function PricingLayout({
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

