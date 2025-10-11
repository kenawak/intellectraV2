'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section with FlickeringGrid */}
      <header className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <FlickeringGrid
          className="z-0 absolute inset-0 size-full"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.4}
          flickerChance={0.1}
        />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
            Turn Ideas into Actionable Projects
          </h1>
          <p className="text-xl mb-6 animate-fade-in-delay">
            Generate, design, and build with cutting-edge AI tools.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/dashboard/projects">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Simplified Features Section */}
      <section className="py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {['Idea Generation', 'Spec Creation', 'Code Scaffolding'].map((feature, index) => (
            <Card
              key={index}
              className="border-none bg-card hover:bg-secondary/50 transition-colors duration-300"
            >
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{feature}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature === 'Idea Generation'
                    ? 'Unleash innovative SaaS ideas with AI.'
                    : feature === 'Spec Creation'
                    ? 'Build detailed specs with ease.'
                    : 'Get instant code stubs to kickstart your project.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-background py-6 text-center mt-auto">
        <div className="max-w-4xl mx-auto flex justify-center gap-6 px-4">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground text-sm">
            Docs
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm">
            About
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground text-sm">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}