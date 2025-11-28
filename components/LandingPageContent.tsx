'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, TrendingUp, Brain, Target, BarChart3, FileText, Radar, Rocket, Users, Zap } from 'lucide-react';

export function LandingPageContent() {
  return (
    <>
      {/* Why Intellectra Section - 2x2 Bento Grid */}
      <section className="py-24 px-6 lg:px-12 bg-background border-b border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Why <span className="text-primary">Intellectra</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The unique advantage of combining Exa&apos;s depth with LinkUp&apos;s freshness
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Exa Deep Dive */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Exa Deep Dive</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Uncover niche pain points and unfiltered community sentiment from Reddit, X, and forums.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* LinkUp Freshness */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">LinkUp Freshness</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get real-time, synthesized answers and trending industry insights from premium sources.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Combined Intelligence */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Combined Intelligence</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AI fuses data from both engines for unparalleled market and trend accuracy.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Actionable Insights */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Actionable Insights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Move beyond summaries; receive product ideas and validation hypotheses directly.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Features Section - 3 Column Bento Grid */}
      <section className="py-24 px-6 lg:px-12 bg-background border-b border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Premium <span className="text-primary">Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Exclusive tools for paid tiers that give you the competitive edge
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Google Trends Integration */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">PRO</span>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Google Trends Integration</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Access proprietary Google Trends data for early signals and market timing. Visualize search velocity and regional interest.
              </p>
            </motion.div>

            {/* Deep Search Report */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">PRO</span>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Deep Search Report</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Generate comprehensive, one-click reports powered by deep, full-text analysis from both sources. Get validated demand and supply gap analysis.
              </p>
            </motion.div>

            {/* Competitive Landscape Monitoring */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">PRO</span>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <Radar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Competitive Landscape Monitoring</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Track competitors and emerging trends in your niche 24/7. Get automated alerts when significant market shifts occur.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section - 3 Column Layout */}
      <section className="py-24 px-6 lg:px-12 bg-background border-b border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Who Is It <span className="text-primary">For</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for builders, creators, and innovators
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Indie Hackers */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Indie Hackers</h3>
              <p className="text-lg font-semibold text-primary mb-4">Find Your Next 6-Figure Idea</p>
              <p className="text-muted-foreground leading-relaxed">
                Stop guessing. Validate problems, find underserved niches, and analyze successful launches instantly.
              </p>
            </motion.div>

            {/* Product Builders */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Product Builders</h3>
              <p className="text-lg font-semibold text-primary mb-4">Build What People Actually Need</p>
              <p className="text-muted-foreground leading-relaxed">
                Get unfiltered customer pain points before you write a single line of code. Data-driven feature prioritization.
              </p>
            </motion.div>

            {/* Content Creators */}
            <motion.div
              className="group relative p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary dark:group-hover:shadow-primary/30 group-hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-6 w-fit">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Content Creators</h3>
              <p className="text-lg font-semibold text-primary mb-4">Dominate Niche Topics</p>
              <p className="text-muted-foreground leading-relaxed">
                Discover untapped keyword opportunities and viral trends before they hit the mainstream. Fuel your content roadmap.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 lg:px-12 bg-card/70 border-b border-primary/20">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Ready to build the <span className="text-primary">future</span>?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of product builders using Intellectra to discover, validate, and launch their next big thing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="group relative overflow-hidden bg-primary text-primary-foreground font-semibold px-12 py-8 text-xl rounded-2xl transition-all duration-300 shadow-xl dark:shadow-primary/30 hover:shadow-2xl dark:hover:shadow-primary/50"
                >
                  <Link href="/login">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}

