'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid';
import { GradientBars } from '@/components/ui/gradient-bars';
import { Blocks, Bot, ChartPie, Dribbble, Film, Github, MessageCircle, Settings2, Twitch, Twitter } from "lucide-react";
import React from "react";
import { Timeline } from "@/components/ui/timeline";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Idea Generation",
    description:
      "Leverage advanced AI to brainstorm and generate innovative SaaS ideas tailored to market trends and user needs.",
  },
  {
    icon: Settings2,
    title: "Automated Spec Creation",
    description:
      "Automatically create detailed project specifications, including features, architecture, and technical requirements.",
  },
  {
    icon: Blocks,
    title: "Code Scaffolding",
    description:
      "Generate production-ready starter code with best practices, security, and scalable structures for rapid development.",
  },
  {
    icon: Film,
    title: "GitHub Integration",
    description:
      "Analyze existing GitHub projects, generate code prompts, and integrate seamlessly with your development workflow.",
  },
  {
    icon: ChartPie,
    title: "Token Usage Analytics",
    description:
      "Monitor and analyze AI token usage across projects with detailed reports and insights for optimization.",
  },
  {
    icon: MessageCircle,
    title: "Collaborative Workspaces",
    description:
      "Work together in shared workspaces, manage projects, and track progress with team collaboration features.",
  },
];

const timelineData = [
  {
    title: "Idea Generation",
    content: (
      <div>
        <p className="text-lg mb-3 font-medium">Generate innovative SaaS ideas with AI. Kick off your project by exploring unique concepts tailored to market needs.</p>
        <img
              src="/undraw_ideas.svg"
              alt="startup template"
              width={500}
              height={200}
              className="mx-auto block"
             />
      </div>
    ),
  },
  {
    title: "Specification Creation",
    content: (
      <div>
        <p className="text-lg mb-3 font-medium">Build detailed project specs automatically. Create comprehensive technical docs and implementation plans with AI assistance.</p>
        <img
              src="/undraw_ai-agent_pdkp.svg"
              alt="startup template"
              width={500}
              height={500}
              className="mx-auto block"
              />
        </div>
    ),
  },
  {
    title: "Code Scaffolding",
    content: (
      <div>
        <p className="text-xl mb-3 font-medium">Generate production-ready starter code. Accelerate development with scalable, secure code structures built by AI.</p>
        <img
              src="/undraw_open-source_g069.svg"
              alt="startup template"
              width={500}
              height={500}
              className="mx-auto block"
              />
            </div>
    ),
  },
];
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section with FlickeringGrid */}
      <header className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <FlickeringGrid
          className="z-0 absolute inset-0 size-full bg-accent"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.4}
          flickerChance={0.1}
        />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
            Supercharge Your SaaS Ideas<br />with AI
          </h1>
          <p className="text-xl mb-6 animate-fade-in-delay">
            Turn your concepts into reality—<br />generate groundbreaking ideas, craft precise specs,<br />and build ready-to-launch code using advanced AI technology.
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
      {/* How It Works Section */}
      <section className="pt-10 pb-12  px-4 bg-secondary">
      <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-center">
How It Works
</h2>
        <Timeline data={timelineData} />
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-secondary/60">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-center">
          Unleash Your Creativity
        </h2>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-(--breakpoint-lg) mx-auto px-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col border rounded-xl py-6 px-5 hover:bg-primary/5"
            >
              <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                <feature.icon className="size-5" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Minimal Footer */}
        <Separator/>
      <footer className="bg-background pr-10 pl-6">
        <div className="py-8 pr-10 pl-6 bg-background/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 xl:px-0">
          {/* Copyright */}
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <Link href="/" target="_blank">
              IntellectraV2
            </Link>
            . All rights reserved.
          </span>
          <div className="flex items-center gap-5 text-muted-foreground">
            <Link href="#" target="_blank">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" target="_blank">
              <Dribbble className="h-5 w-5" />
            </Link>
            <Link href="#" target="_blank">
              <Twitch className="h-5 w-5" />
            </Link>
            <Link href="#" target="_blank">
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}