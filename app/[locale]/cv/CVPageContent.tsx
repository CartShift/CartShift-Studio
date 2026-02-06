'use client';

import { motion } from '@/lib/motion';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import {
  MapPin,
  Mail,
  Linkedin,
  Github,
  Download,
  Briefcase,
  Code,
  Award,
  Globe,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SkillCategory {
  key: string;
  icon: LucideIcon;
  gradient: string;
  bgGlow: string;
}

const skillCategories: SkillCategory[] = [
  { key: 'core', icon: Code, gradient: 'from-cyan-400 via-blue-500 to-indigo-600', bgGlow: 'cyan' },
  {
    key: 'backend',
    icon: Zap,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-600',
    bgGlow: 'violet',
  },
  {
    key: 'cloud',
    icon: Globe,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgGlow: 'emerald',
  },
  {
    key: 'ecommerce',
    icon: TrendingUp,
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    bgGlow: 'amber',
  },
  {
    key: 'database',
    icon: Target,
    gradient: 'from-pink-400 via-rose-500 to-red-600',
    bgGlow: 'pink',
  },
  {
    key: 'apis',
    icon: Sparkles,
    gradient: 'from-indigo-400 via-blue-500 to-cyan-600',
    bgGlow: 'indigo',
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

// Simple Icons CDN mapping for technology logos
const skillIconMap: Record<string, string> = {
  // Frontend & Core
  'Next.js 15': 'nextdotjs',
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

export default function CVPageContent() {
  const t = useTranslations('cv');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none">
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
          className="absolute -bottom-40 end-1/4 w-[400px] h-[400px] bg-gradient-to-br from-violet-300/30 to-indigo-300/20 dark:from-violet-500/15 dark:to-indigo-500/10 rounded-full blur-[100px]"
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-24 lg:pb-48">
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
                <div className="absolute -bottom-1 -end-1 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-emerald-500/90 rounded-full border border-slate-200 dark:border-transparent shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 dark:bg-white"></span>
                  </span>
                  <span className="text-[10px] font-medium text-white uppercase tracking-wide">
                    Open to work
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

              {/* Download Button - Elegant */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="print:hidden"
              >
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-medium transition-all duration-300"
                >
                  <Download className="w-4 h-4" />
                  {t('saveAsPdf')}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Professional Summary - Premium Card */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
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

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-primary-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-surface-300 leading-relaxed">
                {t('summary.text')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Experience Section - Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
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
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="relative group"
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
                      {!isSelfEmployment && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      )}

                      <div
                        className={`relative backdrop-blur-xl border rounded-xl transition-all duration-300 ${
                          isSelfEmployment
                            ? 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/[0.04] p-3 sm:p-4'
                            : 'bg-white/60 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] border-slate-200 dark:border-white/[0.06] hover:border-primary-500/20 p-3 sm:p-5 lg:p-6 hover:bg-white/80 dark:hover:bg-white/[0.04] shadow-sm dark:shadow-none'
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
                                      {isRTL ? 'פתוח להזדמנויות' : 'Open for Work'}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`${isSelfEmployment ? 'text-sm text-slate-500 dark:text-surface-400' : 'text-sm sm:text-base font-semibold bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent'}`}
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
          initial={{ opacity: 0, y: 40 }}
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
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="group relative"
                >
                  <div
                    className={`absolute -inset-0.5 bg-gradient-to-r ${skill.gradient} rounded-xl blur opacity-0 group-hover:opacity-30 transition-all duration-500`}
                  />

                  <div className="relative h-full backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] group-hover:border-primary-500/20 dark:group-hover:border-white/[0.12] rounded-xl p-3 sm:p-5 transition-all duration-300 shadow-sm dark:shadow-none">
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
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 + iIndex * 0.03, duration: 0.3 }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-md text-xs text-slate-600 dark:text-surface-300 cursor-default hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
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
            initial={{ opacity: 0, y: 40 }}
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

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl blur-lg opacity-50" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t('sections.languages')}
              </h2>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 sm:p-5 shadow-sm dark:shadow-none">
                <div className="space-y-3 sm:space-y-4">
                  {languageKeys.map((langKey, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
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
                          initial={{ width: 0 }}
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
      </div>

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
