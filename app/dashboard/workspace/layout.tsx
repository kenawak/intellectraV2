import { Metadata } from 'next';
import { generateSoftwareApplicationSchema } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'Pro Workspace - Ship AI Products',
  description:
    'Saved opportunities + validated ideas with complete Next.js starter prompts. Built for Pro users. Ship MVPs 3x faster with shippable boilerplate prompts.',
  keywords: [
    'ai saas boilerplate',
    'ship ai product',
    'startup mvp prompt',
    'ai saas starter',
    'next.js boilerplate',
  ],
  openGraph: {
    title: 'Pro Workspace - Ship AI Products',
    description:
      'Saved opportunities + validated ideas with complete Next.js starter prompts. Built for Pro users.',
    url: 'https://intellectra.kenawak.works/dashboard/workspace',
  },
  alternates: {
    canonical: '/dashboard/workspace',
  },
};

const structuredData = generateSoftwareApplicationSchema({
  name: 'Intellectra Pro Workspace',
  description:
    'Pro workspace for saving opportunities and validated ideas with complete Next.js starter prompts. Ship MVPs 3x faster.',
  applicationCategory: 'BusinessApplication',
  offers: {
    price: '29',
    priceCurrency: 'USD',
  },
  featureList: [
    'Save opportunities to workspace',
    'Save validated ideas',
    'Complete Next.js starter prompts',
    'Copy-to-clipboard functionality',
    'Pro-only feature',
  ],
  url: 'https://intellectra.kenawak.works/dashboard/workspace',
});

export default function WorkspaceLayout({
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

