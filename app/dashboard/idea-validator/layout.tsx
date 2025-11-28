import { Metadata } from 'next';
import { generateSoftwareApplicationSchema } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'Validate Startup Ideas with AI → Market Proof + Ship',
  description:
    'Generate 5 ideas → Pick 1 → Get market validation + shipping roadmap. Pro workspace integration. AI-powered startup idea validator with market analysis.',
  keywords: [
    'validate startup idea',
    'ai idea generator',
    'product market fit ai',
    'startup idea validator ai',
    'idea validation tool',
  ],
  openGraph: {
    title: 'Validate Startup Ideas with AI → Market Proof + Ship',
    description:
      'Generate 5 ideas → Pick 1 → Get market validation + shipping roadmap. Pro workspace integration.',
    url: 'https://intellectra.kenawak.works/dashboard/idea-validator',
  },
  alternates: {
    canonical: '/dashboard/idea-validator',
  },
};

const structuredData = generateSoftwareApplicationSchema({
  name: 'Intellectra Idea Validator',
  description:
    'AI-powered startup idea validation with market research, competitive analysis, and actionable insights. Get market proof and shipping roadmap.',
  applicationCategory: 'BusinessApplication',
  offers: {
    price: '29',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI-powered idea generation',
    'Market validation with scores',
    'Competitive analysis',
    'Shipping roadmap',
    'Pro workspace integration',
  ],
  url: 'https://intellectra.kenawak.works/dashboard/idea-validator',
});

export default function IdeaValidatorLayout({
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

