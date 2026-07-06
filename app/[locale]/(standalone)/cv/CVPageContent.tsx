'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  m,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useLocale, useMessages } from 'next-intl';
import { useTheme } from 'next-themes';
import { Link } from '@/i18n/navigation';
import { trackCTAClick, trackOutboundLink } from '@/lib/analytics';
import {
  buildCVData,
  type CVData,
  type CVPortfolioProjectKey,
  type CVSkillKey,
  type RawCVMessages,
} from '@/lib/cv/cv-data';
import { companyLogos } from '@/lib/cv/cv-media';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { CVDownloadButton } from './CVDownloadButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  ArrowUpRight,
  Braces,
  Briefcase,
  ChevronRight,
  Cloud,
  Code,
  Cpu,
  GraduationCap,
  Github,
  Globe,
  Languages as LanguagesIcon,
  Linkedin,
  LockOpen,
  Mail,
  MapPin,
  Phone,
  Server,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface PortfolioMedia {
  href: string;
  domain: string;
  imageVariants: {
    en: { light: string; dark?: string };
    he?: { light?: string; dark?: string };
  };
}

const portfolioMedia: Record<CVPortfolioProjectKey, PortfolioMedia> = {
  rightflow: {
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
  },
  starlinker: {
    href: 'https://starlinker.io',
    domain: 'starlinker.io',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/starlinker-en-light.png',
        dark: '/images/cv/portfolio/starlinker-en-dark.png',
      },
    },
  },
  atlasIrwin: {
    href: 'https://atlasirwin.com/',
    domain: 'atlasirwin.com',
    imageVariants: {
      en: {
        light: '/images/cv/portfolio/atlas-irwin-en-light.png',
        dark: '/images/cv/portfolio/atlas-irwin-en-dark.png',
      },
    },
  },
  cartshift: {
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
  },
};

// Bump when portfolio screenshot assets are regenerated so Next/Image serves fresh files.
const PORTFOLIO_MEDIA_VERSION = '20260706';

function withPortfolioMediaVersion(src: string) {
  return `${src}?v=${PORTFOLIO_MEDIA_VERSION}`;
}

function CompanyMark({ experience }: { experience: CVData['experiences'][number] }) {
  const logo = companyLogos[experience.key];

  return (
    <span
      className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-bold text-primary-700 shadow-sm ring-1 ring-inset ring-white/70 dark:border-white/[0.1] dark:bg-white/[0.96] dark:text-primary-700 dark:ring-white/10 print:hidden"
      aria-hidden="true"
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        (experience.company?.trim()?.charAt(0)?.toUpperCase() ?? '·')
      )}
    </span>
  );
}

const skillIcon: Record<CVSkillKey, typeof Code> = {
  productEngineering: Sparkles,
  frontendFullStack: Braces,
  commerceIntegrations: ShoppingBag,
  aiAutomation: Cpu,
  cloudData: Cloud,
  legacyEnterprise: Server,
};

type SectionId = 'summary' | 'experience' | 'skills' | 'portfolio' | 'education';

function useActiveSection(ids: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(ids[0]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

const monthIndex: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function parseDurationMonth(value?: string) {
  const match = value?.trim().match(/^(\w+)\s+(\d{4})$/);
  if (!match) return null;

  const month = monthIndex[match[1].toLowerCase()];
  const year = Number(match[2]);
  if (month === undefined || Number.isNaN(year)) return null;

  return { month, year };
}

function getMonthsBetween(
  start: { month: number; year: number },
  end: { month: number; year: number }
) {
  return Math.max(0, (end.year - start.year) * 12 + end.month - start.month + 1);
}

function getDurationMonths(experience: CVData['experiences'][number]) {
  const [startValue, endValue] = experience.duration.split(/\s+-\s+/);
  const start = parseDurationMonth(startValue);
  if (start) {
    const now = new Date();
    const end =
      endValue?.toLowerCase() === 'present'
        ? { month: now.getMonth(), year: now.getFullYear() }
        : parseDurationMonth(endValue);

    if (end) return getMonthsBetween(start, end);
  }

  if (!experience.durationYears || experience.durationYears.toLowerCase().includes('current')) {
    return 0;
  }

  const years = Number(experience.durationYears.match(/(\d+)\s*year/)?.[1] ?? 0);
  const months = Number(experience.durationYears.match(/(\d+)\s*month/)?.[1] ?? 0);
  return years * 12 + months;
}

function getExperienceYears(experiences: CVData['experiences']) {
  const totalMonths = experiences.reduce(
    (sum, experience) => sum + getDurationMonths(experience),
    0
  );
  return Math.max(1, Math.round(totalMonths / 12));
}

function SectionHeading({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof Briefcase;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary-600 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-primary-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[2rem] sm:leading-[1.15]">
              {title}
            </h2>
            {meta ? (
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-300">
                {meta}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  experience,
  isCurrent,
  isLast,
  index = 0,
  reduceMotion = false,
}: {
  experience: CVData['experiences'][number];
  isCurrent?: boolean;
  isLast?: boolean;
  index?: number;
  reduceMotion?: boolean;
}) {
  return (
    <li className="relative ps-10 print:ps-0">
      {!isLast ? (
        <span
          className="absolute start-4 top-6 bottom-0 w-px bg-gradient-to-b from-slate-300 to-transparent dark:from-white/15 print:hidden"
          aria-hidden="true"
        />
      ) : null}
      <span
        className={`absolute start-[10px] top-4 flex h-3 w-3 items-center justify-center rounded-full border-2 print:hidden ${
          isCurrent
            ? 'border-primary-500 bg-primary-500'
            : 'border-slate-300 bg-white dark:border-white/25 dark:bg-slate-950'
        }`}
        aria-hidden="true"
      >
        {isCurrent && !reduceMotion ? (
          <span className="absolute inset-0 rounded-full bg-primary-500/60 motion-safe:animate-ping" />
        ) : null}
      </span>

      <m.article
        initial={reduceMotion ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-64px' }}
        transition={{ duration: 0.38, delay: Math.min(index, 8) * 0.045, ease: [0.22, 1, 0.36, 1] }}
        className="group rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-primary-500/40 sm:p-6 print:break-inside-avoid print:shadow-none print:hover:border-slate-200"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <CompanyMark experience={experience} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold leading-tight text-slate-950 dark:text-white">
                  {experience.title}
                </h3>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                      {!reduceMotion ? (
                        <span className="absolute inset-0 rounded-full bg-emerald-500 motion-safe:animate-ping" />
                      ) : null}
                      <span className="relative rounded-full bg-emerald-500" />
                    </span>
                    Now
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
                {experience.company}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-surface-300 sm:text-end">
            <p className="font-medium tabular-nums">{experience.duration}</p>
            {experience.location ? (
              <p className="text-xs text-slate-500 dark:text-surface-400">{experience.location}</p>
            ) : null}
          </div>
        </div>
        {experience.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700 dark:text-surface-300">
            {experience.description}
          </p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {experience.highlights.map(highlight => (
            <li
              key={highlight}
              className="flex gap-2.5 text-sm leading-6 text-slate-700 dark:text-surface-200"
            >
              <ChevronRight
                className="mt-1 h-4 w-4 flex-none text-primary-600 dark:text-primary-300 rtl:rotate-180"
                aria-hidden="true"
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </m.article>
    </li>
  );
}

function BrowserChrome({ domain }: { domain: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.06] px-3 py-2">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <span className="mx-auto max-w-[70%] truncate rounded-md bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-white/70">
        {domain}
      </span>
    </div>
  );
}

function PortfolioPreview({
  projectKey,
  label,
  locale,
  previewTheme,
}: {
  projectKey: CVPortfolioProjectKey;
  label: string;
  locale: string;
  previewTheme: 'light' | 'dark';
}) {
  const project = portfolioMedia[projectKey];
  const fallback = project.imageVariants.en;
  const preferred = locale === 'he' ? project.imageVariants.he : fallback;
  const light = preferred?.light ?? preferred?.dark ?? fallback.light;
  const dark = preferred?.dark ?? preferred?.light ?? fallback.dark ?? fallback.light;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-white/[0.08]">
      <BrowserChrome domain={label} />
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={withPortfolioMediaVersion(light)}
          alt=""
          fill
          sizes="(min-width: 1024px) 34vw, 100vw"
          className={`object-cover object-top transition-opacity duration-500 ${
            previewTheme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <Image
          src={withPortfolioMediaVersion(dark)}
          alt=""
          fill
          sizes="(min-width: 1024px) 34vw, 100vw"
          className={`object-cover object-top transition-opacity duration-500 ${
            previewTheme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
}

const SECTION_IDS: SectionId[] = ['summary', 'experience', 'skills', 'portfolio', 'education'];

const CV_HERO_PORTRAIT = '/images/cv/yotam-studio-cv.png';

export default function CVPageContent() {
  const messages = useMessages() as { cv: RawCVMessages & { status?: { openToWork?: string } } };
  const cv = useMemo(() => buildCVData(messages.cv), [messages.cv]);
  const locale = useLocale();
  const isRTL = locale === 'he';
  const [earlierExperienceOpen, setEarlierExperienceOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { resolvedTheme } = useTheme();
  const previewTheme = resolvedTheme === 'light' ? 'light' : 'dark';
  const reduceMotion = useReducedMotion();
  const openToWork = messages.cv.status?.openToWork ?? 'Open to work';
  const activeSection = useActiveSection(SECTION_IDS);
  const experienceYears = getExperienceYears(cv.experiences);
  const careerMeta = isRTL
    ? `קריירה · ${experienceYears}+ שנים`
    : `Career · ${experienceYears}+ yrs`;

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 220);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const progressWidth = useTransform(progress, v => `${v * 100}%`);

  const phoneHref = `tel:${cv.phone.replace(/\s+/g, '')}`;

  const handlePortfolioProjectClick = (projectKey: CVPortfolioProjectKey) => {
    const project = portfolioMedia[projectKey];
    trackOutboundLink(project.href, project.domain);
    trackCTAClick(project.domain, 'cv_portfolio_project');
  };

  const navItems: Array<{ id: SectionId; label: string }> = [
    { id: 'summary', label: cv.sections.summary },
    { id: 'experience', label: cv.sections.experience },
    { id: 'skills', label: cv.sections.skills },
    { id: 'portfolio', label: cv.sections.portfolio },
    { id: 'education', label: cv.sections.education },
  ];

  const collapseArchiveLabel = isRTL ? 'סגירת הארכיון' : 'Collapse archive';

  return (
    <div
      className="min-h-screen bg-surface-50 text-slate-900 dark:bg-surface-950 dark:text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <a
        href="#cv-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to CV content
      </a>

      <m.div
        className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-gradient-to-r from-primary-500 via-primary-400 to-emerald-400 print:hidden"
        style={{ width: progressWidth }}
        aria-hidden="true"
      />

      <div className="fixed inset-0 pointer-events-none print:hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_18%_0%,rgba(33,117,155,0.18),transparent_38%),radial-gradient(circle_at_82%_10%,rgba(150,191,72,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(33,117,155,0.28),transparent_38%),radial-gradient(circle_at_82%_10%,rgba(150,191,72,0.16),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <header className="relative z-30 px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90 dark:text-white sm:px-4">
          <Logo size="sm" />
          <nav aria-label="CV contact actions" className="flex items-center gap-1.5 text-sm">
            <div className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-white/[0.1] dark:bg-white/[0.04] sm:flex">
              <a
                href={phoneHref}
                aria-label={cv.phone}
                title={cv.phone}
                className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden tabular-nums lg:inline">{cv.phone}</span>
              </a>
              <span className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
              <a
                href={`mailto:${cv.email}`}
                aria-label={cv.email}
                title={cv.email}
                className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">{cv.email}</span>
              </a>
              <span className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
              <a
                href={cv.contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={cv.contact.linkedinLabel}
                title={cv.contact.linkedinLabel}
                className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">{cv.contact.linkedinLabel}</span>
              </a>
              <span className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
              <a
                href={cv.contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={cv.contact.githubLabel}
                title={cv.contact.githubLabel}
                className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">{cv.contact.githubLabel}</span>
              </a>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-white/[0.1] dark:bg-white/[0.04] sm:hidden">
              <a
                href={phoneHref}
                aria-label={cv.phone}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${cv.email}`}
                aria-label={cv.email}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={cv.contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={cv.contact.linkedinLabel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={cv.contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={cv.contact.githubLabel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900 hover:text-white dark:text-surface-100 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/70 p-0.5 dark:border-white/[0.1] dark:bg-white/[0.04]">
              <ThemeToggle className="rounded-lg" />
            </div>
            <LanguageSwitcher />
            <CVDownloadButton label={cv.labels.saveAsPdf} preparingLabel={cv.labels.preparingPdf} />
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {hasScrolled ? (
          <m.nav
            key="cv-section-nav"
            aria-label="CV sections"
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 top-3 z-40 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 print:hidden"
          >
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mx-auto flex w-max items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg shadow-slate-950/5 backdrop-blur-md dark:border-white/[0.1] dark:bg-slate-900/90 dark:shadow-black/40">
                {navItems.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      activeSection === item.id
                        ? 'text-white dark:text-slate-950'
                        : 'text-slate-600 hover:text-slate-950 dark:text-surface-300 dark:hover:text-white'
                    }`}
                  >
                    {activeSection === item.id ? (
                      <m.span
                        layoutId="cv-nav-pill"
                        className="absolute inset-0 rounded-full bg-slate-950 dark:bg-white"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 380, damping: 32 }
                        }
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </m.nav>
        ) : null}
      </AnimatePresence>

      <CookieConsent
        variant="compact"
        delayMs={800}
        className="static inset-auto bottom-auto z-20 mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:px-8"
      />

      <main
        id="cv-main"
        className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-28"
      >
        <section id="summary" className="mb-16 scroll-mt-28">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.035] lg:min-h-[min(72vh,680px)]">
            <div
              className="pointer-events-none absolute -inset-x-24 -top-24 h-72 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(33,117,155,0.14),transparent_70%)] dark:bg-[radial-gradient(50%_100%_at_50%_0%,rgba(33,117,155,0.28),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-[min(40%,380px)] lg:block">
              <Image
                src={CV_HERO_PORTRAIT}
                alt={cv.name}
                fill
                priority
                sizes="380px"
                className="object-contain object-bottom"
              />
            </div>
            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_min(40%,380px)] lg:items-stretch lg:gap-10 lg:p-10 lg:pb-0">
              <div className="min-w-0 lg:pb-10">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600 dark:text-surface-300">
                  <span className="relative inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-emerald-500 motion-safe:animate-ping" />
                      <span className="relative rounded-full bg-emerald-500" />
                    </span>
                    {openToWork}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {cv.location}
                  </span>
                  <span className="text-slate-300 dark:text-surface-600">•</span>
                  <span>{cv.workAuthorization}</span>
                </div>

                <m.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="mt-6 max-w-4xl pb-2 text-[2.75rem] font-bold leading-[1.14] tracking-[-0.02em] text-slate-950 text-balance dark:text-white sm:text-[4.25rem] sm:leading-[1.08]"
                >
                  {cv.name}
                </m.h1>

                <p className="mt-4 text-lg font-semibold text-primary-700 dark:text-primary-300 sm:text-xl">
                  {cv.headline}
                </p>
                <p className="mt-6 max-w-3xl text-base leading-7 text-slate-700 dark:text-surface-200 sm:text-[17px] sm:leading-[1.7]">
                  {cv.summary.text}
                </p>
              </div>

              <div className="relative mx-auto h-80 w-full max-w-[300px] lg:hidden">
                <Image
                  src={CV_HERO_PORTRAIT}
                  alt={cv.name}
                  fill
                  priority
                  className="object-contain object-bottom"
                  sizes="300px"
                />
              </div>
              <div className="hidden lg:block" aria-hidden />
            </div>
          </div>
        </section>

        <section id="experience" className="mb-16 scroll-mt-28">
          <SectionHeading
            icon={Briefcase}
            title={cv.sections.experience}
            meta={careerMeta}
          />
          <ol className="space-y-4">
            {cv.recentExperiences.map((experience, index) => (
              <TimelineItem
                key={experience.key}
                experience={experience}
                index={index}
                reduceMotion={reduceMotion ?? false}
                isCurrent={index === 0}
                isLast={false}
              />
            ))}
          </ol>
          <div
            id="earlier-experience-list"
            className={`relative mt-4 ${reduceMotion ? '' : 'transition-[max-height,opacity] duration-500 ease-out'} ${
              earlierExperienceOpen
                ? 'max-h-[400rem] opacity-100'
                : 'max-h-[26rem] overflow-hidden opacity-100'
            }`}
          >
            <ol className="space-y-4">
              {cv.earlierExperiences.map((experience, index) => (
                <TimelineItem
                  key={experience.key}
                  experience={experience}
                  index={cv.recentExperiences.length + index}
                  reduceMotion={reduceMotion ?? false}
                  isLast={index === cv.earlierExperiences.length - 1}
                />
              ))}
            </ol>

            {!earlierExperienceOpen ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-56 items-end justify-center bg-gradient-to-t from-surface-50 via-surface-50/95 to-transparent dark:from-surface-950 dark:via-surface-950/95">
                <button
                  type="button"
                  aria-expanded={earlierExperienceOpen}
                  aria-controls="earlier-experience-list"
                  onClick={() => setEarlierExperienceOpen(true)}
                  className="pointer-events-auto group mb-2 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/[0.12] dark:bg-slate-900/90 dark:text-white dark:shadow-black/40 dark:hover:border-primary-400/50 dark:hover:text-primary-200"
                >
                  <span>{cv.labels.earlierExperience}</span>
                  <ChevronRight
                    className="h-4 w-4 rotate-90 opacity-70 transition-transform group-hover:translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            ) : null}
          </div>

          {earlierExperienceOpen ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                aria-expanded={earlierExperienceOpen}
                aria-controls="earlier-experience-list"
                onClick={() => setEarlierExperienceOpen(false)}
                className="group inline-flex min-h-[40px] items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-surface-300 dark:hover:text-primary-200"
              >
                <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {collapseArchiveLabel}
                <ChevronRight className="h-3.5 w-3.5 -rotate-90 opacity-70" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>

        <section id="skills" className="mb-16 scroll-mt-28">
          <SectionHeading
            icon={Code}
            title={cv.sections.skills}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cv.skills.map(group => {
              const Icon = skillIcon[group.key] ?? Code;
              return (
                <m.article
                  key={group.key}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-primary-500/40"
                >
                  <div className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl transition-opacity group-hover:bg-primary-500/15 dark:bg-primary-400/10" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="truncate font-bold text-slate-950 dark:text-white">
                        {group.category}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-400 dark:text-surface-500">
                      {String(group.items.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                      <span
                        key={item}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-primary-300 hover:text-primary-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-200 dark:hover:border-primary-500/40 dark:hover:text-primary-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </m.article>
              );
            })}
          </div>
        </section>

        <section id="portfolio" className="mb-16 scroll-mt-28">
          <SectionHeading
            icon={Globe}
            title={cv.sections.portfolio}
          />
          <p className="mb-8 max-w-3xl text-base leading-7 text-slate-700 dark:text-surface-200">
            {cv.portfolio.intro}
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            {cv.portfolio.projects.map(project => {
              const media = portfolioMedia[project.key];
              return (
                <m.article
                  key={project.key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white/85 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-primary-500/40"
                >
                  <a
                    href={media.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handlePortfolioProjectClick(project.key)}
                    className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <PortfolioPreview
                      projectKey={project.key}
                      label={media.domain}
                      locale={locale}
                      previewTheme={previewTheme}
                    />
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">
                          {project.eyebrow}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                          {media.domain}
                        </h3>
                      </div>
                      <span
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-all group-hover:border-primary-500 group-hover:bg-primary-600 group-hover:text-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-100 dark:group-hover:border-primary-400"
                        aria-hidden="true"
                      >
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-surface-200">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.signals.map(signal => (
                        <span
                          key={signal}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-200"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {cv.portfolio.visitProject}
                      <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                    </span>
                  </a>
                </m.article>
              );
            })}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-primary-50/40 p-5 dark:border-white/[0.08] dark:from-white/[0.035] dark:to-primary-500/[0.06]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
              {cv.portfolio.clients.kicker}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
              {cv.portfolio.clients.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-surface-200">
              {cv.portfolio.clients.description}
            </p>
            <Link
              href="/work"
              onClick={() => trackCTAClick('client_case_studies', 'cv_portfolio_work')}
              className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
            >
              {cv.portfolio.clients.cta}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section id="education" className="mb-16 scroll-mt-28">
          <SectionHeading
            icon={GraduationCap}
            title={`${cv.sections.education} · ${cv.sections.languages}`}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {cv.sections.education}
                </h3>
              </div>
              <p className="mt-4 font-semibold text-slate-800 dark:text-surface-100">
                {cv.education.university}
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-surface-300">
                {cv.education.program}
              </p>
              {cv.education.years ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-surface-400">
                  {cv.education.years}
                </p>
              ) : null}
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                  <LanguagesIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {cv.sections.languages}
                </h3>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cv.languages.map(language => (
                  <div
                    key={language.key}
                    className="flex items-baseline justify-between rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language.name}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-surface-400">
                      {language.level}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-16">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-primary-50/35 to-white p-8 text-slate-950 shadow-xl shadow-slate-900/5 dark:border-white/[0.12] dark:from-slate-900/95 dark:via-slate-900 dark:to-surface-950 dark:text-white dark:shadow-black/50 sm:p-12 print:hidden">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(33,117,155,0.14),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(150,191,72,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(33,117,155,0.4),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(150,191,72,0.26),transparent_45%)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]"
              aria-hidden="true"
            />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <h2 className="max-w-2xl text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-slate-950 dark:text-white sm:text-[2.5rem]">
                  {isRTL
                    ? 'מחפשים מפתח מוצר סניור בברלין, מרחוק או היברידי?'
                    : 'Looking for a senior product engineer?'}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/70 sm:text-base">
                  {isRTL
                    ? 'אשמח לשמוע על המשרה או הפרויקט שלכם. תשובה תוך 24 שעות.'
                    : "I'd love to hear about the role or project. I reply within 24 hours."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={phoneHref}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {cv.phone}
                </a>
                <a
                  href={`mailto:${cv.email}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {cv.email}
                </a>
                <a
                  href={cv.contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  {cv.contact.linkedinLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/70 px-4 py-8 text-center text-xs text-slate-500 dark:border-white/[0.06] dark:text-surface-500 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Yotam Faraggi · Senior Product Engineer</span>
          <div className="flex items-center gap-4">
            <a href={`mailto:${cv.email}`} className="hover:text-primary-600 dark:hover:text-primary-300">
              {cv.email}
            </a>
            <a
              href={cv.contact.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 dark:hover:text-primary-300"
            >
              {cv.contact.githubLabel}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
