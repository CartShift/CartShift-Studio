'use client';

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Link } from '@/i18n/navigation';
import { trackCTAClick, trackOutboundLink } from '@/lib/analytics';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { CVDownloadButton } from './CVDownloadButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Logo } from '@/components/ui/Logo';
import {
  MapPin,
  Mail,
  Linkedin,
  Github,
  Briefcase,
  Code,
  Award,
  Globe,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Moon,
  Sun,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SkillCategory {
  key: string;
  icon: LucideIcon;
  gradient: string;
  bgGlow: string;
}

const skillCategories: SkillCategory[] = [
  {
    key: 'primary',
    icon: Code,
    gradient: 'from-cyan-400 via-blue-500 to-primary-600',
    bgGlow: 'cyan',
  },
  {
    key: 'ecommerce',
    icon: Zap,
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    bgGlow: 'amber',
  },
  {
    key: 'ai',
    icon: Sparkles,
    gradient: 'from-primary-400 via-accent-500 to-cyan-600',
    bgGlow: 'primary',
  },
  {
    key: 'cloud',
    icon: Globe,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgGlow: 'emerald',
  },
  {
    key: 'legacy',
    icon: TrendingUp,
    gradient: 'from-slate-400 via-slate-500 to-slate-700',
    bgGlow: 'slate',
  },
];

const experienceKeys = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
];

const languageKeys = ['hebrew', 'english', 'german'];
const languagePercentages: Record<string, number> = {
  hebrew: 100,
  english: 95,
  german: 30,
};

interface PortfolioProject {
  key: 'cartshift' | 'atlasIrwin' | 'starlinker' | 'rightflow';
  href: string;
  domain: string;
  imageVariants: {
    en: {
      light: string;
      dark?: string;
    };
    he?: {
      light?: string;
      dark?: string;
    };
  };
  gradient: string;
  surface: string;
  featured?: boolean;
}

function getPortfolioImageVariants(project: PortfolioProject, locale: string) {
  const fallback = project.imageVariants.en;
  const preferred = locale === 'he' ? project.imageVariants.he : fallback;
  const light = preferred?.light ?? preferred?.dark ?? fallback.light;
  const dark = preferred?.dark ?? preferred?.light ?? fallback.dark ?? fallback.light;

  return { light, dark };
}

const portfolioProjects: PortfolioProject[] = [
  {
    key: 'rightflow',
    href: 'https://right-flow.com',
    domain: 'right-flow.com',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/rightflow-en-light.png',
        dark: '/images/cv/portfolio/rightflow-en-dark.png',
      },
      he: {
        light: '/images/cv/portfolio/rightflow-he-light.png',
        dark: '/images/cv/portfolio/rightflow-he-dark.png',
      },
    },
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    surface:
      'from-emerald-500/[0.14] via-teal-500/[0.08] to-cyan-500/[0.14] dark:from-emerald-500/[0.14] dark:via-teal-500/[0.05] dark:to-cyan-500/[0.12]',
  },
  {
    key: 'starlinker',
    href: 'https://starlinker.io',
    domain: 'starlinker.io',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/starlinker-en-light.png',
        dark: '/images/cv/portfolio/starlinker-en-dark.png',
      },
    },
    gradient: 'from-primary-500 via-sky-500 to-cyan-400',
    surface:
      'from-primary-500/[0.14] via-sky-500/[0.08] to-cyan-400/[0.14] dark:from-primary-500/[0.14] dark:via-sky-500/[0.05] dark:to-cyan-400/[0.12]',
  },
  {
    key: 'atlasIrwin',
    href: 'https://atlasirwin.com/',
    domain: 'atlasirwin.com',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/atlas-irwin-en-light.png',
        dark: '/images/cv/portfolio/atlas-irwin-en-dark.png',
      },
    },
    gradient: 'from-fuchsia-600 via-cyan-400 to-lime-300',
    surface:
      'from-fuchsia-600/[0.14] via-cyan-400/[0.08] to-lime-300/[0.14] dark:from-fuchsia-600/[0.14] dark:via-cyan-400/[0.05] dark:to-lime-300/[0.12]',
  },
  {
    key: 'cartshift',
    href: 'https://cart-shift.com/en',
    domain: 'cart-shift.com',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/cartshift-en-light.png',
        dark: '/images/cv/portfolio/cartshift-en-dark.png',
      },
      he: {
        light: '/images/cv/portfolio/cartshift-he-light.png',
        dark: '/images/cv/portfolio/cartshift-he-dark.png',
      },
    },
    gradient: 'from-primary-500 via-cyan-500 to-accent-500',
    surface:
      'from-primary-500/[0.16] via-cyan-500/[0.08] to-accent-500/[0.14] dark:from-primary-500/[0.14] dark:via-cyan-500/[0.05] dark:to-accent-500/[0.12]',
    featured: true,
  },
];

// Simple Icons CDN mapping for technology logos
const skillIconMap: Record<string, string> = {
  // Frontend & Core
  'Next.js 15': 'nextdotjs',
  'Next.js 16': 'nextdotjs',
  React: 'react',
  TypeScript: 'typescript',
  JavaScript: 'javascript',
  'Vue.js': 'vuedotjs',
  'HTML5/CSS3': 'html5',
  'Tailwind CSS': 'tailwindcss',
  'Framer Motion': 'framer',
  // Backend & Runtime
  'Node.js': 'nodedotjs',
  PHP: 'php',
  Python: 'python',
  Java: 'openjdk',
  'C#': 'csharp',
  'C++': 'cplusplus',
  GraphQL: 'graphql',
  'REST APIs': 'swagger',
  // Cloud & DevOps
  'Google Cloud Platform': 'googlecloud',
  Firebase: 'firebase',
  Vercel: 'vercel',
  Docker: 'docker',
  'CI/CD': 'githubactions',
  Git: 'git',
  'GitHub Actions': 'githubactions',
  // E-Commerce & CMS
  Shopify: 'shopify',
  'Shopify APIs': 'shopify',
  WordPress: 'wordpress',
  HubSpot: 'hubspot',
  Laravel: 'laravel',
  Stripe: 'stripe',
  // Data & Storage
  PostgreSQL: 'postgresql',
  Firestore: 'firebase',
  MongoDB: 'mongodb',
  SQL: 'mysql',
  Redis: 'redis',
  'PL/SQL': 'oracle',
  // AI & Automation
  'OpenAI API': 'openai',
  'Claude API': 'anthropic',
  LangChain: 'langchain',
  Webhooks: 'webhook',
  Puppeteer: 'puppeteer',
  Playwright: 'playwright',
};

// Pre-defined particle positions to avoid hydration mismatch
const particlePositions = [
  { left: 5, top: 12, duration: 4.5, delay: 0 },
  { left: 15, top: 35, duration: 5, delay: 0.5 },
  { left: 25, top: 65, duration: 4, delay: 1 },
  { left: 35, top: 22, duration: 5.5, delay: 1.5 },
  { left: 45, top: 78, duration: 4.2, delay: 0.3 },
  { left: 55, top: 48, duration: 5.2, delay: 0.8 },
  { left: 65, top: 18, duration: 4.8, delay: 1.2 },
  { left: 75, top: 72, duration: 4.3, delay: 0.2 },
  { left: 85, top: 38, duration: 5.3, delay: 1.8 },
  { left: 95, top: 88, duration: 4.6, delay: 0.6 },
  { left: 8, top: 58, duration: 5.1, delay: 1.1 },
  { left: 22, top: 82, duration: 4.4, delay: 0.4 },
  { left: 38, top: 8, duration: 4.9, delay: 1.4 },
  { left: 52, top: 92, duration: 5.4, delay: 0.9 },
  { left: 68, top: 28, duration: 4.7, delay: 1.6 },
  { left: 82, top: 52, duration: 5.0, delay: 0.7 },
];

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particlePositions.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient orb
function GradientOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.35, 0.2],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

function PortfolioPreview({
  project,
  title,
  label,
  locale,
  onOpen,
}: {
  project: PortfolioProject;
  title: string;
  label: string;
  locale: string;
  onOpen: () => void;
}) {
  const screenshots = getPortfolioImageVariants(project, locale);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const isLightPreview = previewTheme === 'light';
  const isDarkPreview = previewTheme === 'dark';

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="group/mockup relative block overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.7)]"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="hidden items-center rounded-full border border-white/10 bg-white/[0.06] p-0.5 text-white/70 sm:flex"
            role="group"
            aria-label="Preview theme"
          >
            <button
              type="button"
              aria-label="Preview light screenshot"
              aria-pressed={isLightPreview}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                setPreviewTheme('light');
              }}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                isLightPreview ? 'bg-white text-slate-950' : 'text-white/42 hover:text-white/78'
              }`}
            >
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Preview dark screenshot"
              aria-pressed={isDarkPreview}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                setPreviewTheme('dark');
              }}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                isDarkPreview ? 'bg-white text-slate-950' : 'text-white/42 hover:text-white/78'
              }`}
            >
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="max-w-[9rem] truncate rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-white/70 sm:max-w-[11rem]">
            {label}
          </div>
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={screenshots.light}
          alt=""
          fill
          aria-hidden="true"
          loading="eager"
          className={`object-cover object-top transition-[opacity,transform] duration-700 group-hover/mockup:scale-[1.03] ${
            isLightPreview ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(min-width: 1024px) 44vw, 100vw"
        />
        <Image
          src={screenshots.dark}
          alt=""
          fill
          aria-hidden="true"
          loading="eager"
          className={`object-cover object-top transition-[opacity,transform] duration-700 group-hover/mockup:scale-[1.03] ${
            isDarkPreview ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(min-width: 1024px) 44vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.16)_42%,rgba(2,6,23,0.62)_100%)]" />
        <div
          className={`absolute inset-0 bg-gradient-to-br ${project.surface} mix-blend-screen opacity-90`}
          aria-hidden="true"
        />
      </div>
    </a>
  );
}

export default function CVPageContent() {
  const t = useTranslations('cv');
  const locale = useLocale();
  const isRTL = locale === 'he';
  const portfolio = t.raw('portfolio' as any) as {
    intro: string;
    visitProject: string;
    projects: Record<
      PortfolioProject['key'],
      {
        eyebrow: string;
        description: string;
        signals: string[];
      }
    >;
    clients: {
      kicker: string;
      title: string;
      description: string;
      cta: string;
    };
  };

  const handlePortfolioProjectClick = (project: PortfolioProject) => {
    trackOutboundLink(project.href, project.domain);
    trackCTAClick(project.domain, 'cv_portfolio_project');
  };

  const handlePortfolioWorkClick = () => {
    trackCTAClick('client_case_studies', 'cv_portfolio_work');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950" dir={isRTL ? 'rtl' : 'ltr'}>
      <a
        href="#cv-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to CV content
      </a>

      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none print:hidden">
        {/* Main gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-200/40 via-transparent to-transparent dark:from-primary-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-200/40 via-transparent to-transparent dark:from-accent-900/20" />

        {/* Animated gradient orbs */}
        <GradientOrb
          className="absolute -top-40 -end-40 w-[600px] h-[600px] bg-gradient-to-br from-primary-300/30 to-cyan-300/20 dark:from-primary-500/20 dark:to-cyan-500/10 rounded-full blur-[100px]"
          delay={0}
        />
        <GradientOrb
          className="absolute top-1/3 -start-40 w-[500px] h-[500px] bg-gradient-to-br from-accent-300/30 to-pink-300/20 dark:from-accent-500/20 dark:to-pink-500/10 rounded-full blur-[100px]"
          delay={2}
        />
        <GradientOrb
          className="absolute -bottom-40 end-1/4 w-[400px] h-[400px] bg-gradient-to-br from-primary-300/30 to-accent-300/20 dark:from-primary-500/15 dark:to-accent-500/10 rounded-full blur-[100px]"
          delay={4}
        />

        {/* Grid pattern overlay - Light Mode */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        {/* Grid pattern overlay - Dark Mode */}
        <div
          className="absolute inset-0 opacity-[0.02] hidden dark:block"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="relative z-20 px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/60 dark:shadow-none sm:px-4">
          <Logo size="sm" />
          <nav
            aria-label="CV actions"
            className="flex flex-wrap items-center justify-end gap-2 text-sm"
          >
            <a
              href="mailto:yotamon@gmail.com"
              className="hidden min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 font-semibold text-slate-700 transition-colors hover:text-primary-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-200 dark:hover:text-primary-300 sm:inline-flex"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t('email')}
            </a>
            <a
              href="https://linkedin.com/in/yotam-faraggi"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 font-semibold text-slate-700 transition-colors hover:text-primary-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-200 dark:hover:text-primary-300 md:inline-flex"
            >
              <Linkedin className="h-4 w-4" aria-hidden="true" />
              {t('linkedin')}
            </a>
            <LanguageSwitcher />
            <CVDownloadButton label={t('saveAsPdf')} />
          </nav>
        </div>
      </header>

      <CookieConsent
        variant="compact"
        delayMs={800}
        className="static inset-auto bottom-auto z-20 mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:px-8"
      />

      <main
        id="cv-main"
        className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pb-28"
      >
        {/* Hero Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-24"
        >
          {/* Elegant card */}
          <div className="relative backdrop-blur-xl bg-white/60 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-white/[0.01] border border-slate-200 dark:border-white/[0.06] rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-12 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* Subtle top accent line */}
            <div className="absolute top-0 inset-inline-8 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />

            <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-16">
              {/* Profile Image - Clean and elegant */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative flex-shrink-0"
              >
                {/* Soft glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl" />

                <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 shadow-lg dark:shadow-none">
                  <Image
                    src="/images/yotam-programmer.png"
                    alt={t('name')}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Status indicator - subtle */}
                <div className="absolute -bottom-1 -end-1 flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-950/95 px-3 py-1.5 shadow-lg shadow-slate-900/22 ring-1 ring-white/70 dark:border-transparent dark:bg-emerald-500/90 dark:shadow-none dark:ring-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 dark:bg-white"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300 dark:bg-white"></span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                    {t('status.openToWork')}
                  </span>
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-start">
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-2 lg:mb-3 tracking-tight text-slate-900 dark:text-white"
                >
                  {t('name')}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-surface-300 font-light mb-4 lg:mb-6 max-w-xl"
                >
                  {t('subtitle')}
                </motion.p>

                {/* Contact Info - Inline and minimal */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-surface-400"
                >
                  <a
                    href="https://maps.google.com/?q=Berlin,Germany"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{t('location')}</span>
                  </a>
                  <span className="hidden sm:inline text-slate-300 dark:text-surface-600">•</span>
                  <a
                    href="mailto:yotamon@gmail.com"
                    className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t('email')}</span>
                  </a>
                  <span className="hidden sm:inline text-slate-300 dark:text-surface-600">•</span>
                  <a
                    href="https://linkedin.com/in/yotam-faraggi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>{t('linkedin')}</span>
                  </a>
                  <span className="hidden sm:inline text-slate-300 dark:text-surface-600">•</span>
                  <a
                    href="https://github.com/yotamon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>{t('github')}</span>
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Professional Summary - Premium Card */}
        <motion.section
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 sm:mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.summary')}
              </h2>
            </div>
          </div>

          <div className="relative">
            <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-surface-300 leading-relaxed">
                {t('summary.text')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Experience Section - Timeline */}
        <motion.section
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 sm:mb-20"
        >
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500 to-pink-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.experience')}
              </h2>
            </div>
          </div>

          <div className="relative">
            {/* Timeline line with gradient - Visible on mobile now */}
            <div className="absolute start-4 lg:start-8 top-0 bottom-0 w-0.5 block">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500 via-accent-500 to-slate-200 dark:to-surface-700" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500 via-accent-500 to-transparent blur-sm opacity-50" />
            </div>

            <div className="space-y-4 sm:space-y-6">
              {experienceKeys.map((expKey, index) => {
                const highlights = t.raw(`experience.${expKey}.highlights` as any) as string[];
                const hasDescription = t.has(`experience.${expKey}.description` as any);
                const hasLocation = t.has(`experience.${expKey}.location` as any);
                const isSelfEmployment =
                  expKey === 'cartshift' ||
                  expKey === 'entrepreneurship' ||
                  expKey === 'ecommerce_venture';
                const isCurrentPosition = expKey === 'cartshift';

                return (
                  <motion.div
                    key={index}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="relative"
                  >
                    {/* Connector Line - Responsive */}
                    <div className="absolute top-8 start-4 w-4 lg:start-7 lg:w-8 h-[2px] bg-gradient-to-r from-slate-200 to-transparent dark:from-white/10 dark:to-transparent block" />

                    <div
                      className={`absolute start-[calc(1rem+1px)] lg:start-[calc(2rem+1px)] -translate-x-1/2 top-[1.7rem] ${isSelfEmployment ? 'w-2.5 h-2.5' : 'w-3 h-3'} block z-20`}
                    >
                      <div
                        className={`absolute inset-0 ${isSelfEmployment ? 'bg-slate-300 dark:bg-surface-600' : 'bg-primary-500 dark:bg-primary-400'} rounded-full ${isSelfEmployment ? '' : 'animate-ping opacity-20'}`}
                      />
                      <div
                        className={`absolute inset-0 ${isSelfEmployment ? 'bg-slate-300 dark:bg-surface-600' : 'bg-gradient-to-br from-primary-500 to-accent-600'} rounded-full shadow-sm ring-2 ring-surface-50 dark:ring-surface-950`}
                      />
                    </div>

                    <div className="ms-10 lg:ms-16 relative">
                      <div
                        className={`relative backdrop-blur-xl border rounded-xl transition-all duration-300 ${
                          isSelfEmployment
                            ? 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/[0.04] p-3 sm:p-4'
                            : 'bg-white/60 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] border-slate-200 dark:border-white/[0.06] p-3 sm:p-5 lg:p-6 shadow-sm dark:shadow-none'
                        }`}
                      >
                        {/* Company header with Open for Work badge */}
                        <div
                          className={`flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 ${isSelfEmployment && highlights.length === 0 ? '' : 'mb-4'}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3
                                className={`${isSelfEmployment ? 'text-base sm:text-lg font-semibold text-slate-700 dark:text-surface-300' : 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white'}`}
                              >
                                {t(`experience.${expKey}.title` as any)}
                              </h3>
                              {/* Open for Work badge - only on current position */}
                              {isCurrentPosition && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="relative inline-flex items-center"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-md opacity-40 animate-pulse" />
                                  <div className="relative flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 rounded-full border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">
                                      {t('status.openToWork')}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`${isSelfEmployment ? 'text-sm text-slate-500 dark:text-surface-400' : 'text-sm sm:text-base font-semibold text-primary-600 dark:text-primary-400'}`}
                              >
                                {t(`experience.${expKey}.company` as any)}
                              </span>
                              {hasLocation && (
                                <span className="text-slate-500 dark:text-surface-500 text-sm flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {t(`experience.${expKey}.location` as any)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col lg:items-end text-sm">
                            <span
                              className={`${isSelfEmployment ? 'text-slate-500 dark:text-surface-400' : 'text-primary-600 dark:text-primary-400'} font-semibold`}
                            >
                              {t(`experience.${expKey}.duration` as any)}
                            </span>
                            {!isSelfEmployment && (
                              <span className="text-slate-500 dark:text-surface-500">
                                {t(`experience.${expKey}.durationYears` as any)}
                              </span>
                            )}
                          </div>
                        </div>

                        {hasDescription && !isSelfEmployment && (
                          <p className="text-slate-600 dark:text-surface-300/80 mb-4 text-sm sm:text-base leading-relaxed">
                            {t(`experience.${expKey}.description` as any)}
                          </p>
                        )}

                        {highlights.length > 0 && (
                          <ul className="space-y-2">
                            {highlights.map((highlight, hIndex) => (
                              <li
                                key={hIndex}
                                className="flex items-start gap-2 text-slate-600 dark:text-surface-300/90 text-xs sm:text-sm"
                              >
                                <span
                                  className={`mt-0.5 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                                >
                                  <ChevronRight className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                                </span>
                                <span className="flex-1">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Skills Section - Bento Grid */}
        <motion.section
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 sm:mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.skills')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {skillCategories.map((skill, index) => {
              const items = t.raw(`skills.${skill.key}.items` as any) as string[];
              const IconComponent = skill.icon;

              return (
                <motion.div
                  key={index}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="relative"
                >
                  <div className="relative h-full backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 sm:p-5 transition-all duration-300 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center shadow-lg`}
                        whileInView={{ rotate: [0, -5, 5, 0] }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + index * 0.08, duration: 0.5 }}
                      >
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        {t(`skills.${skill.key}.category` as any)}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item, iIndex) => {
                        const iconSlug = skillIconMap[item];
                        return (
                          <motion.span
                            key={iIndex}
                            initial={false}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 + iIndex * 0.03, duration: 0.3 }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-md text-xs text-slate-600 dark:text-surface-300 cursor-default"
                          >
                            {iconSlug && (
                              <img
                                src={`https://cdn.simpleicons.org/${iconSlug}/9ca3af`}
                                alt=""
                                className="w-3 h-3 opacity-70"
                                loading="lazy"
                              />
                            )}
                            {item}
                          </motion.span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Education & Languages - Stacked on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Education */}
          <motion.section
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl blur-lg opacity-50" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.education')}
              </h2>
            </div>

            <div className="relative">
              <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 sm:p-5 shadow-sm dark:shadow-none">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {t('education.university')}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400 text-sm font-medium mb-1">
                      {t('education.program')}
                    </p>
                    <p className="text-slate-500 dark:text-surface-500 text-xs mb-2">
                      {t('education.years')}
                    </p>
                    <p className="text-slate-600 dark:text-surface-300/80 text-xs sm:text-sm leading-relaxed">
                      {t('education.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Languages */}
          <motion.section
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-lg opacity-50" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.languages')}
              </h2>
            </div>

            <div className="relative">
              <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 sm:p-5 shadow-sm dark:shadow-none">
                <div className="space-y-3 sm:space-y-4">
                  {languageKeys.map((langKey, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-800 dark:text-white text-sm font-medium">
                          {t(`languageSkills.${langKey}.name` as any)}
                        </span>
                        <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                          {t(`languageSkills.${langKey}.level` as any)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-surface-800/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={false}
                          whileInView={{ width: `${languagePercentages[langKey]}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg,
                              hsl(${200 + index * 20}, 80%, 50%),
                              hsl(${280 + index * 20}, 80%, 60%))`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Portfolio Section - Founder-led products */}
        <motion.section
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-16 sm:mt-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-accent-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-accent-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.portfolio' as any)}
              </h2>
            </div>
          </div>

          <div className="mb-8 max-w-3xl">
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-surface-300 leading-relaxed">
              {portfolio.intro}
            </p>
          </div>

          <div className="space-y-5">
            {portfolioProjects.map((project, index) => {
              const copy = portfolio.projects[project.key];
              const mediaAtEnd = index % 2 === 1;

              return (
                <motion.article
                  key={project.key}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.5,
                    delay: 0.06 * index,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="relative overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white/70 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${project.surface} opacity-90`}
                    aria-hidden="true"
                  />
                  <div
                    className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r ${project.gradient} opacity-60`}
                    aria-hidden="true"
                  />
                  <div
                    className={`pointer-events-none absolute ${mediaAtEnd ? '-start-12' : '-end-12'} top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gradient-to-br ${project.gradient} blur-3xl opacity-20`}
                    aria-hidden="true"
                  />

                  <div className="relative grid grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:p-6">
                    <div className={mediaAtEnd ? 'lg:order-2' : ''}>
                      <PortfolioPreview
                        project={project}
                        title={`${project.domain} preview`}
                        label={project.domain}
                        locale={locale}
                        onOpen={() => handlePortfolioProjectClick(project)}
                      />
                    </div>

                    <div className={mediaAtEnd ? 'lg:order-1' : ''}>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-surface-400">
                            {copy.eyebrow}
                          </p>
                          <h3 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
                            {project.domain}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-surface-300/90">
                        {copy.description}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {copy.signals.map(signal => (
                          <span
                            key={signal}
                            className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-surface-200"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-6 dark:border-white/[0.08]">
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handlePortfolioProjectClick(project)}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                        >
                          <span>{portfolio.visitProject}</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                        <span className="font-mono text-xs sm:text-sm text-slate-500 dark:text-surface-400">
                          {project.domain}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative mt-5 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/78 px-5 py-6 text-slate-950 shadow-2xl shadow-slate-200/70 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950 dark:text-white dark:shadow-slate-900/20 sm:px-6 lg:px-8"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.14),_transparent_36%),linear-gradient(135deg,rgba(248,250,252,0.92),rgba(226,232,240,0.5))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.18),_transparent_36%)]"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/50">
                  {portfolio.clients.kicker}
                </p>
                <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                  {portfolio.clients.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/72 sm:text-base">
                  {portfolio.clients.description}
                </p>
              </div>

              <Link
                href="/work"
                onClick={handlePortfolioWorkClick}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all duration-300 hover:bg-slate-800 dark:border-white/12 dark:bg-white dark:text-slate-950 dark:shadow-none dark:hover:bg-white/90"
              >
                <span>{portfolio.clients.cta}</span>
                <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </motion.div>
        </motion.section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/70 px-4 py-8 text-center text-xs text-slate-500 dark:border-white/[0.06] dark:text-surface-500 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>CartShift Studio CV</span>
          <div className="flex items-center gap-4">
            <a href="mailto:yotamon@gmail.com" className="hover:text-primary-500">
              {t('email')}
            </a>
            <a
              href="https://github.com/yotamon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-500"
            >
              {t('github')}
            </a>
          </div>
        </div>
      </footer>

      {/* Print styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          [data-cookie-consent-variant],
          [role='group'][aria-label='Preview theme'] {
            display: none !important;
          }

          main {
            padding: 0 !important;
            max-width: none !important;
          }

          section,
          article {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          * {
            background: transparent !important;
            color: #1f2937 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          .backdrop-blur-xl,
          .backdrop-blur-2xl {
            backdrop-filter: none !important;
            background: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
          }

          .bg-gradient-to-br,
          .bg-gradient-to-r {
            background: white !important;
          }

          .text-primary-400,
          .text-accent-400 {
            color: rgb(var(--color-primary-600)) !important;
          }

          .text-surface-300,
          .text-surface-400 {
            color: rgb(var(--color-surface-600)) !important;
          }

          .text-surface-500 {
            color: rgb(var(--color-surface-500)) !important;
          }

          .text-white {
            color: rgb(var(--color-surface-900)) !important;
          }

          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
