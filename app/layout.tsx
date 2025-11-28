import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { PostHogProvider } from "@/components/providers/PostHogProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Intellectra: AI Product Discovery → Ship in Days",
    template: "%s | Intellectra",
  },
  description:
    "Generate validated AI product opportunities from any market topic. Pro features: Save to workspace, shippable starter prompts. Ship MVPs 3x faster.",
  keywords: [
    "ai product opportunity generator",
    "startup idea validator ai",
    "market analysis ai tool",
    "ship ai saas product",
    "ai saas boilerplate prompts",
    "product discovery ai",
    "market opportunities ai",
    "validate startup idea",
  ],
  authors: [{ name: "Intellectra" }],
  creator: "Intellectra",
  publisher: "Intellectra",
  metadataBase: new URL("https://intellectra.kenawak.works"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://intellectra.kenawak.works",
    siteName: "Intellectra",
    title: "Intellectra: AI Product Discovery → Ship in Days",
    description:
      "Generate validated AI product opportunities from any market topic. Pro features: Save to workspace, shippable starter prompts.",
    images: [
      {
        url: "/intelectra.png",
        width: 1200,
        height: 630,
        alt: "Intellectra - AI Product Discovery Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellectra: AI Product Discovery → Ship in Days",
    description:
      "Generate validated AI product opportunities from any market topic. Pro features: Save to workspace, shippable starter prompts.",
    images: ["/intelectra.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification if available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            {children}
            <Toaster/>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
