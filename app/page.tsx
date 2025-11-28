'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Blocks, Settings2, Sparkles, ArrowRight, Check, Search, Zap, Package, FileSearch, LineChart, Target } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';
import { ThemeSwitcher } from '@/components/ui/shadcn-io/theme-switcher';
import { LandingPageContent } from '@/components/LandingPageContent';
import { BentoGrid } from '@/components/BentoGrid';
import {PricingPage} from '@/components/PricingPage';
import { usePostHog } from '@posthog/react';
import { PostHogPageview } from '@/components/PostHogPageview';
const features = [
  // Row 1: (4 columns) + (2 columns) = 6
  {
    title: 'Combined Real-Time Search',
    description: 'Get synthesized answers and trending insights from LinkUp\'s fresh data combined with Exa\'s broad, general web index.',
    icon: <Search className="size-6" />,
    access: 'Free' as const,
    span: 4,
  },
  {
    title: 'Deep Search & Full-Text Reports',
    description: 'Generate comprehensive, one-click reports powered by deep, full-text analysis from both sources.',
    icon: <FileSearch className="size-6" />,
    access: 'Paid' as const,
    span: 2,
  },
  // Row 2: (3 columns) + (3 columns) = 6
  {
    title: 'Basic Idea Generation',
    description: 'Generate initial side project ideas and high-level market summaries based on aggregated developer pain points.',
    icon: <Bot className="size-6" />,
    access: 'Free' as const,
    span: 3,
  },
  {
    title: 'Google Trends Integration',
    description: 'Access proprietary Google Trends data for early market signals, search velocity, and regional interest visualization.',
    icon: <LineChart className="size-6" />,
    access: 'Paid' as const,
    span: 3,
  },
  // Row 3: (3 columns) + (3 columns) = 6
  {
    title: 'Competitive & Market Tracking',
    description: 'Track competitor activities and emerging niche trends 24/7 with automated alerts and monitoring dashboards.',
    icon: <Target className="size-6" />,
    access: 'Paid' as const,
    span: 3,
  },
  {
    title: 'Production-Ready Scaffolding',
    description: 'Download complete project structures with dependencies, config files, and starter code—ready to build on day one.',
    icon: <Blocks className="size-6" />,
    access: 'Paid' as const,
    span: 3,
  },
];

const stats = [
  { label: 'Project Ideas Generated', value: '10K+' },
  { label: 'Active Developers', value: '500+' },
  { label: 'Projects Scaffolded', value: '2.5K+' },
];

// TextRotator Component
const TextRotator = ({ words, className = "", interval = 3000, textGradient = true, letterAnimation = true }: { words: string[], className?: string, interval?: number, textGradient?: boolean, letterAnimation?: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const letterVariants: any = {
    hidden: { opacity: 0, y: 20, filter: "blur(5px)", scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -20,
      filter: "blur(5px)", 
      scale: 0.9,
      transition: { delay: i * 0.02, duration: 0.3, ease: "easeInOut" },
    }),
  };

  const getGradientColors = (index: number, total: number) => {
    const hueStart = (currentIndex * 30) % 360;
    const hue = hueStart + (index / total * 60);
    return `hsl(${hue}, 80%, 60%)`;
  };

  return (
    <span
      className={cn(
        "relative inline-block min-w-[250px] min-h-[1.5em]",
        !letterAnimation && textGradient && "bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {letterAnimation ? (
          <motion.span
            key={currentIndex}
            className="absolute inset-0 flex items-center justify-center w-full -mt-3"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {words[currentIndex].split("").map((letter, i, array) => (
              <motion.span
                key={`${currentIndex}-${i}`}
                custom={i}
                variants={letterVariants}
                style={
                  textGradient
                    ? {
                        color: getGradientColors(i, array.length),
                        display: "inline-block",
                        textShadow: "0 0 15px rgba(100, 100, 200, 0.15)",
                        fontWeight: "inherit",
                      }
                    : {}
                }
                className={letter === " " ? "ml-2" : ""}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.span>
        ) : (
          <motion.span
            key={currentIndex}
            className="absolute inset-0 flex items-center justify-center w-full"
            initial={{ y: 40, opacity: 0, filter: "blur(8px)", scale: 0.95 }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ y: -40, opacity: 0, filter: "blur(8px)", scale: 0.95 }}
            transition={{ y: { type: "spring", stiffness: 100, damping: 15 }, opacity: { duration: 0.5 }, filter: { duration: 0.4 }, scale: { duration: 0.4 } }}
          >
            {words[currentIndex]}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="opacity-0">{words[0]}</span>
    </span>
  );
};

// HeroBackground Component
const HeroBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 mix-blend-overlay opacity-30 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "150px 150px",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px, 30px 30px",
          backgroundPosition: "0 0, 15px 15px",
          opacity: 0.3,
        }}
      />
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/20 blur-2xl"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div
        className="absolute bottom-40 -left-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='white' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />
      <motion.div
        className="absolute -inset-full h-[300%] w-[200%] opacity-10"
        style={{
          background: "linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.4) 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)",
          transform: "rotate(-15deg)",
        }}
        animate={{ left: ["-100%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
      />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
      </div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  const { data: session, isPending } = authClient.useSession();
  const posthog = usePostHog();
  const isAuthenticated = !!session?.user;
  const user = session?.user || null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedInside = (event.target as Element)?.closest(".user-dropdown-wrapper");
      if (!clickedInside) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkApiKeyStatus = async () => {
      try {
        const response = await fetch('/api/settings/api-key/check');
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey || false);
        }
      } catch (error) {
        console.error("API key check failed:", error);
      }
    };
    checkApiKeyStatus();
  }, [isAuthenticated]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    if (!isAuthenticated) {
      toast("Please sign in to search for ideas. Click 'Sign In' to get started!");
      return;
    }
    setIsLoading(true);
    
    // Track feature used
    posthog?.capture('Feature Used', {
      feature_name: 'Idea Search',
      user_id: user?.id,
      query: query.substring(0, 100), // Limit query length
    });
    
    try {
      const params = new URLSearchParams({ prompt: query, provider: 'exa', numResults: '5' });
      const response = await fetch(`/api/ideas/generate?${params.toString()}`);
      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }
      const data = await response.json();
      // Redirect to dashboard with results or handle results
      router.push(`/dashboard/new-project?query=${encodeURIComponent(query)}`);
    } catch (error) {
      toast.error("Failed to search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (isPending) {
    return (
      <div className="relative bg-background h-screen w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        toastOptions={{
          classNames: {
            toast: "!text-white !bg-black !border-1 !border-zinc-700",
          },
        }}
      />
      <PostHogPageview />
      <div className="relative bg-background h-screen w-full flex flex-col items-center justify-center overflow-x-hidden">
      {/* Navigation Bar */}
        <motion.nav
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "fixed top-0 left-0 right-0 z-50 w-full py-3 md:py-4 px-4 sm:px-6 lg:px-10 transition-all duration-300",
            isScrolled
              ? "bg-background/30 backdrop-blur-md border-b border-border"
              : "bg-transparent"
          )}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link href="/" className="flex items-center">
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20">
                  <img
                    src="https://res.cloudinary.com/dfonae1gu/image/upload/v1746794132/Black_White_Minimal_Simple_Modern_Creative_Studio_Ego_Logo__3_-removebg-preview_wiziz0.png"
                    alt="Intellectra Logo"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span className="text-foreground relative text-lg sm:text-xl md:text-2xl font-bold ml-3 sm:ml-4 md:ml-5 sm:-left-4 md:-left-6">
            Intellectra
                </span>
          </Link>
            </motion.div>

            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-foreground p-2 focus:outline-none"
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </motion.button>
            </div>

            <motion.div
              className="hidden md:flex items-center gap-4 lg:gap-8"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link
                href="/dashboard/projects"
                className="text-sm lg:text-base text-foreground hover:text-muted-foreground font-medium transition-colors"
              >
                Projects
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard/bookmarks"
                    className="text-sm lg:text-base text-foreground hover:text-muted-foreground font-medium transition-colors"
                  >
                    Bookmarks
                  </Link>
                  <Link
                    href="/#contact"
                    className="text-sm lg:text-base text-foreground hover:text-muted-foreground font-medium transition-colors"
                  >
                    Contact
                  </Link>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative inline-block top-[-10px] user-dropdown-wrapper">
                      <Avatar
                        onClick={() => setIsOpen(!isOpen)}
                        className="border-border bg-card hover:cursor-pointer text-foreground w-10 h-10 border shadow"
                      >
                        <AvatarImage src={user?.image || undefined} alt={user?.name || undefined} />
                        <AvatarFallback className="bg-card text-foreground w-10 h-10 flex items-center justify-center">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isOpen && (
                        <>
                          <Button
                            onClick={handleSignOut}
                            className="absolute border-border border left-1/2 -translate-x-1/2 mt-2 min-w-[120px] text-sm lg:text-base px-4 lg:px-5 py-2 bg-card text-foreground hover:bg-card/80 font-medium hover:cursor-pointer transition-colors z-10 rounded-xs text-center"
                          >
                            Sign Out
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
              {!isAuthenticated && (
                <Button 
                  onClick={() => {
                    posthog?.capture('Button Clicked', {
                      button_text: 'Sign In',
                      section: 'hero',
                    });
                    router.push('/login');
                  }}
                  className="text-sm border-border border lg:text-base px-4 lg:px-5 py-2 bg-card text-foreground hover:bg-card/80 rounded-xs font-medium hover:cursor-pointer transition-colors"
                >
                  Sign In
              </Button>
            )}
              <div className="ml-2">
                <ThemeSwitcher defaultValue="system" onChange={setTheme} value={theme} />
              </div>
            </motion.div>
          </div>
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden mt-2 mx-4 overflow-hidden bg-card rounded-2xl border border-border shadow-xl"
              >
                <div className="flex flex-col py-3 px-4 space-y-3">
                  <Link
                    href="/dashboard/projects"
                    className="text-foreground hover:text-muted-foreground font-medium transition-colors py-2 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link
                        href="/dashboard/bookmarks"
                        className="text-foreground hover:text-muted-foreground font-medium transition-colors py-2 text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Bookmarks
                      </Link>
                      <Link
                        href="/#contact"
                        className="text-foreground hover:text-muted-foreground font-medium transition-colors py-2 text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>
                    </>
                  )}
                  {!isAuthenticated && (
                    <button 
                      onClick={() => {
                        posthog?.capture('Button Clicked', {
                          button_text: 'Sign In',
                          section: 'mobile-menu',
                        });
                        router.push('/login');
                      }} 
                      className="bg-card text-foreground hover:bg-card/80 border border-border rounded-full font-medium hover:cursor-pointer transition-colors py-2 px-4 text-center"
                    >
                      Sign In
                    </button>
                  )}
                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{user?.email}</span>
                      <button onClick={handleSignOut} className="text-sm lg:text-base px-4 lg:px-5 py-2 bg-card text-foreground hover:bg-card/80 border border-border rounded-full font-medium hover:cursor-pointer transition-colors">
                        Sign Out
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center pt-2">
                    <ThemeSwitcher defaultValue="system" onChange={setTheme} value={theme} />
          </div>
      </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* Hero Background */}
        <HeroBackground />
        
        {/* Hero Content */}
        <motion.div
          className="z-20 text-center px-4 pt-32 pb-20 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.h1
            className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold max-w-4xl mx-auto leading-tight flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span>Discover Market Opportunities</span>
            <TextRotator words={["Validate Ideas", "Scaffold Projects"]} className="font-bold block" interval={4000} letterAnimation={true} />
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-base md:text-lg mt-4 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            From signal to scaffold—instantly. The all-in-one platform using Exa and LinkUp to validate your next big idea and build the code to launch it.          </motion.p>
          <motion.div
            className="mt-12 w-full flex justify-center px-2 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <div className="relative flex items-center backdrop-blur-sm bg-card/50 p-2 rounded-xl border border-border shadow-lg w-full max-w-xl mx-auto">
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10"
                animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.02, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex items-center relative z-10 w-full">
                <svg className="w-5 h-5 text-muted-foreground absolute left-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Intellectra for ideas..."
                  className="pl-12 pr-16 py-3 text-sm rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 w-full"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(inputValue)}
                  disabled={isLoading}
                />
                <motion.button
                  className="right-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 z-10 disabled:opacity-50 absolute"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  onClick={() => {
                    posthog?.capture('Button Clicked', {
                      button_text: 'Search',
                      section: 'hero',
                    });
                    handleSearch(inputValue);
                  }}
                  disabled={isLoading}
                >
                  <motion.span
                    className="cursor-pointer"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: isLoading ? 0.5 : 1 }}
                    transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0, repeatType: "reverse" }}
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="mt-6 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {[
              "AI-powered trend analysis for indie hackers",
              "Real-time market insights for product builders",
              "Unique use cases for Telegram channels or groups",
              "Data-driven project ideas for developers",
            ].map((prompt, index) => (
              <motion.button
                key={index}
                className="px-4 py-2 text-xs bg-card/50 text-foreground/80 rounded-full hover:bg-card border border-border transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  posthog?.capture('Button Clicked', {
                    button_text: prompt.substring(0, 50),
                    section: 'hero',
                  });
                  setInputValue(prompt);
                  handleSearch(prompt);
                }}
              >
                {prompt}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Side Cards - Hidden on mobile, shown on xl screens */}
        <motion.div
          className="absolute bottom-10 left-10 z-30 xl:block hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          <div className="absolute inset-0 rounded-2xl bg-card/20 blur-xl"></div>
          <motion.div
            className="bg-card/80 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl w-80 relative border border-border"
            whileHover={{ y: -3, boxShadow: "0 15px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="p-6 flex flex-col relative">
              <div className="flex justify-between items-start">
                <h3 className="text-foreground text-2xl font-bold tracking-tight">
                  Why
                  <br />
                  Intellectra?
                </h3>
                <div className="text-foreground/80 bg-primary/10 p-2 rounded-lg backdrop-blur-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
            </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="bg-primary/10 p-2 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="font-medium">AI-Powered Insights</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="bg-primary/10 p-2 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Real-time Trend Analysis</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="bg-primary/10 p-2 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-medium">Data-Driven Decisions</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-10 right-10 z-30 xl:block hidden"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <motion.div className="w-80 relative" whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <div className="absolute inset-0 rounded-2xl bg-card/20 blur-xl"></div>
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">Market Insights</h3>
                    <p className="text-muted-foreground text-sm">Powered by AI & Real-time Data</p>
                  </div>
                      </div>
                <div className="space-y-4 mb-6">
                  {[
                    { title: "Trend Analysis", desc: "Real-time market insights", progress: 100 },
                    { title: "Idea Generation", desc: "AI-powered project ideas", progress: 95 },
                    { title: "Market Validation", desc: "Data-driven decisions", progress: 90 },
                  ].map((project, index) => (
                    <motion.div key={index} className="bg-card/50 rounded-lg p-3 border border-border" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 + index * 0.1 }}>
                      <div className="flex justify-between mb-2">
                        <div>
                          <h4 className="text-foreground text-sm font-medium">{project.title}</h4>
                          <p className="text-muted-foreground text-xs">{project.desc}</p>
                      </div>
                      </div>
                      <div className="h-1 bg-muted rounded-full">
                        <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1, delay: 2 }} />
                      </div>
                    </motion.div>
                  ))}
                    </div>
                <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                  {[
                    { value: "24/7", label: "Updates" },
                    { value: "95%", label: "Accuracy" },
                    { value: "10k+", label: "Sources" },
                  ].map((stat, index) => (
                    <motion.div key={index} className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 + index * 0.1 }}>
                      <div className="text-foreground font-semibold">{stat.value}</div>
                      <div className="text-muted-foreground text-xs">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </div>

      <div className="bg-background dark:bg-[#0a0a0a] text-foreground overflow-x-hidden">
      {/* Feature Overview Section */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-background border-b border-border">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Everything You Need to
              <span className="block mt-2 text-primary">Ship Faster</span>
        </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From discovery to deployment, streamline your development workflow
            </p>
          </div>

          <BentoGrid items={features.map(feature => ({
            title: feature.title,
            description: feature.description,
            icon: feature.icon,
            span: feature.span,
            access: feature.access,
          }))} />
        </div>
      </section>
      <PricingPage />
      {/* Landing Page Content Sections */}
      <LandingPageContent />

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 bg-background border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8">
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Intellectra. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 text-muted-foreground">
              <Link href="#" className="text-sm hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="text-sm hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="text-sm hover:text-primary transition-colors">Contact</Link>
              </div>
              <div className="flex items-center">
                <ThemeSwitcher defaultValue="system" onChange={setTheme} value={theme} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
