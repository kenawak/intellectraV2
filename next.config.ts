import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optional: Uncomment to proxy PostHog requests through your domain (useful for ad blockers)
  // async rewrites() {
  //   return [
  //     {
  //       source: '/ingest/:path*',
  //       destination: 'https://app.posthog.com/:path*',
  //     },
  //   ];
  // },
  async rewrites() {
    return [
      {
        source: '/llm.txt',
        destination: '/api/llm-txt',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
};

export default nextConfig;
