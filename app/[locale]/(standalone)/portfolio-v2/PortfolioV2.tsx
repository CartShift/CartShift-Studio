'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Circle, MapPin } from 'lucide-react';

type Project = {
  number: string;
  title: string;
  headline: string;
  description: string;
  tags: readonly string[];
  href: string | null;
  external: boolean;
  note: string;
  surface: string;
  ink: string;
  image?: string;
  imageAlt?: string;
  secondaryImage?: string;
};

const work: readonly Project[] = [
  {
    number: '01',
    title: 'Curalife',
    headline: 'Commerce meets\ndigital health.',
    description:
      'Owned major customer-facing product and platform work across Shopify commerce and digital health, including a HIPAA-compliant telemedicine acquisition product built end-to-end.',
    tags: ['Product ownership', 'Shopify', 'Healthcare', 'Full-stack'],
    image: '/images/case-studies/curalife-metabolic-wellness-platform/hero.jpg',
    secondaryImage: '/images/case-studies/curalife-metabolic-wellness-platform/gallery-01.jpg',
    imageAlt: 'Curalife digital health and commerce experience',
    href: '/en/work/curalife-metabolic-wellness-platform',
    external: false,
    note: 'Primary acquisition + revenue funnel',
    surface: '#d6ebdd',
    ink: '#102119',
  },
  {
    number: '02',
    title: 'StarLinker',
    headline: 'AI that acts\ninside the product.',
    description:
      'A visual planning product for mapping goals, tasks, habits, and notes on a connected canvas with AI-assisted next-step suggestions and product actions.',
    tags: ['AI-native UX', 'Productivity', 'Next.js', 'Full-stack'],
    image: '/images/cv/portfolio/starlinker-en-light.png',
    imageAlt: 'StarLinker visual planning product interface',
    href: 'https://starlinker.io',
    external: true,
    note: 'Founder-led product',
    surface: '#cfd4ff',
    ink: '#171b43',
  },
  {
    number: '03',
    title: 'Ensemblis',
    headline: 'An operating system\nfor music artists.',
    description:
      'An AI-assisted artist management platform for releases, content creation, media intelligence, marketing workflows, and distribution operations. Currently in development.',
    tags: ['AI workflows', 'Music tech', 'Product design', 'In development'],
    href: null,
    external: false,
    note: 'Building now',
    surface: '#ddd3ff',
    ink: '#21163d',
  },
  {
    number: '04',
    title: 'RightFlow',
    headline: 'Complex documents.\nClear decisions.',
    description:
      'A document review and verification platform for pension and payroll contribution checks, with structured review flows and report export.',
    tags: ['Document workflows', 'Financial data', 'Automation', 'Full-stack'],
    image: '/images/cv/portfolio/rightflow-en-light.png',
    imageAlt: 'RightFlow document review product interface',
    href: 'https://right-flow.com',
    external: true,
    note: 'Founder-led product',
    surface: '#ead9ba',
    ink: '#362716',
  },
];

const experience = [
  {
    years: '2025 / NOW',
    company: 'CartShift Studio',
    role: 'Founder & Senior Full-Stack Engineer',
    detail: 'Independent product engineering, e-commerce, integrations, and AI-assisted software.',
  },
  {
    years: '2021 / 2025',
    company: 'Curalife',
    role: 'Full Stack Developer & R&D Lead',
    detail: 'Commerce, digital health, acquisition products, cloud infrastructure, and integrations.',
  },
  {
    years: '2019 / 2021',
    company: 'ParagonEX',
    role: 'Software & Integration Developer',
    detail: 'Fintech integrations and high-traffic production web systems.',
  },
  {
    years: '2011 / 2019',
    company: 'Earlier engineering',
    role: 'Integration, product & e-commerce',
    detail: 'HOT, Leumi Bank, Elbit Systems, Mamram, independent products, and client work.',
  },
] as const;

const reveal = {
  hidden: { opacity: 0, y: 42 },
  visible: { opacity: 1, y: 0 },
};

const ease = [0.22, 1, 0.36, 1] as const;

function BrowserFrame({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[1.35rem] border border-black/15 bg-[#f8f7f2] shadow-[0_40px_90px_rgba(0,0,0,0.18)] ${className}`}>
      <div className="flex h-9 items-center gap-1.5 border-b border-black/10 bg-white/75 px-4 backdrop-blur sm:h-11 sm:px-5">
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="ms-3 h-2.5 w-24 rounded-full bg-black/[0.06] sm:w-36" />
      </div>
      <div className="relative aspect-[16/9] bg-white">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 90vw, 72vw" className="object-cover object-top" />
      </div>
    </div>
  );
}

function EnsemblisVisual() {
  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden p-4 sm:min-h-[38rem] sm:p-8 lg:p-12">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#21163d_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -end-16 -top-24 size-72 rounded-full border border-[#21163d]/10 sm:size-[28rem]" />
      <div className="absolute -end-8 -top-16 size-56 rounded-full border border-[#21163d]/10 sm:size-[22rem]" />

      <div className="relative mx-auto flex h-full max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[1.6rem] border border-black/20 bg-[#131313] text-white shadow-[0_55px_120px_rgba(38,20,78,0.35)] sm:rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:px-7 sm:text-[10px]">
            <span>Ensemblis / Artist OS</span>
            <span className="rounded-full border border-white/15 bg-white/[0.035] px-3 py-1.5 text-white/75">Atlas Irwin</span>
          </div>

          <div className="grid gap-px bg-white/10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-[#131313] p-5 sm:p-7 lg:p-9">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#b8a9ff] sm:text-[10px]">
                <span className="size-1.5 rounded-full bg-[#b8a9ff]" />
                Next release
              </div>
              <h3 className="mt-8 max-w-[8ch] text-4xl font-medium leading-[0.9] tracking-[-0.055em] sm:text-6xl">
                Dancing in Color
              </h3>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
                Release intelligence, assets, campaign planning, distribution, and content in one connected workspace.
              </p>
              <div className="mt-10 space-y-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.16em] text-white/45">
                {['Lyrics analyzed', 'Stems indexed', 'Campaign draft', 'Metadata 92%'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                    <span>{item}</span>
                    <span className="text-white/25">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1b1b1b] p-4 sm:p-6 lg:p-7">
              <div className="grid h-full gap-3 sm:grid-cols-2">
                {[
                  ['Content engine', '14 ideas', 'Generated from lyrics, audio and release context'],
                  ['Distribution', 'Ready', 'Release package validated across metadata and assets'],
                  ['Audience signals', '+18.4%', 'Trend intelligence from the last 30 days'],
                  ['Media vault', '32 assets', 'Production-ready artwork and campaign variants'],
                ].map(([label, value, helper], index) => (
                  <div key={label} className="group flex min-h-40 flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 transition-colors duration-300 hover:bg-white/[0.06] sm:min-h-48 sm:p-5">
                    <div className="flex items-start justify-between">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/38 sm:text-[10px]">{label}</p>
                      <p className="text-[9px] text-white/20">0{index + 1}</p>
                    </div>
                    <div>
                      <p className="text-3xl font-medium tracking-[-0.05em] sm:text-4xl">{value}</p>
                      <p className="mt-2 max-w-[24ch] text-xs leading-5 text-white/38">{helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  const reduceMotion = useReducedMotion();

  const visual = (
    <motion.div
      className="group relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.75rem]"
      style={{ backgroundColor: project.surface, color: project.ink }}
      whileHover={reduceMotion ? undefined : { scale: 0.994 }}
      transition={{ duration: 0.55, ease }}
    >
      <div className="absolute start-5 top-5 z-20 flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md sm:start-7 sm:top-7 sm:px-4 sm:text-[10px]">
        <Circle className="size-2 fill-current" aria-hidden="true" />
        {project.note}
      </div>

      {project.title === 'Ensemblis' ? (
        <EnsemblisVisual />
      ) : project.title === 'Curalife' && project.image && project.secondaryImage ? (
        <div className="relative min-h-[31rem] overflow-hidden p-5 pt-20 sm:min-h-[44rem] sm:p-10 sm:pt-24 lg:min-h-[54rem] lg:p-16 lg:pt-28">
          <div className="absolute -end-20 bottom-4 text-[24vw] font-semibold leading-none tracking-[-0.09em] opacity-[0.055] sm:text-[18vw] lg:text-[14rem]">
            01
          </div>
          <BrowserFrame
            src={project.image}
            alt={project.imageAlt ?? project.title}
            className="relative z-10 mx-auto w-[94%] rotate-[-1.3deg] sm:w-[86%] lg:w-[76%]"
          />
          <BrowserFrame
            src={project.secondaryImage}
            alt="Curalife secondary product view"
            className="absolute bottom-6 end-4 z-20 hidden w-[44%] rotate-[2.5deg] sm:block lg:bottom-10 lg:end-10 lg:w-[38%]"
          />
        </div>
      ) : project.image ? (
        <div className="relative min-h-[29rem] overflow-hidden p-5 pt-20 sm:min-h-[42rem] sm:p-10 sm:pt-24 lg:min-h-[50rem] lg:p-16 lg:pt-28">
          <div className="absolute -end-8 bottom-0 text-[24vw] font-semibold leading-none tracking-[-0.09em] opacity-[0.055] sm:text-[18vw] lg:text-[14rem]">
            {project.number}
          </div>
          <BrowserFrame
            src={project.image}
            alt={project.imageAlt ?? project.title}
            className="relative z-10 mx-auto w-[96%] rotate-[0.8deg] transition-transform duration-700 ease-out group-hover:rotate-0 group-hover:scale-[1.015] sm:w-[88%] lg:w-[80%]"
          />
        </div>
      ) : null}

      {project.href ? (
        <div className="absolute bottom-5 end-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#171717] text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:bottom-7 sm:end-7 sm:size-16">
          <ArrowUpRight className="size-5 sm:size-6" aria-hidden="true" />
        </div>
      ) : null}
    </motion.div>
  );

  if (!project.href) return visual;

  return (
    <a
      href={project.href}
      target={project.external ? '_blank' : undefined}
      rel={project.external ? 'noreferrer' : undefined}
      aria-label={`${project.title}${project.external ? ' (opens in a new tab)' : ''}`}
    >
      {visual}
    </a>
  );
}

function ProjectSection({ project, index }: { project: Project; index: number }) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const numberY = useTransform(scrollYProgress, [0, 1], [70, -70]);

  return (
    <motion.article
      ref={sectionRef}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.85, delay: reduceMotion ? 0 : index * 0.025, ease }}
      className="relative"
    >
      <div className="grid gap-8 lg:grid-cols-[0.28fr_0.92fr] lg:gap-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between border-t border-black/20 pt-4 lg:block lg:border-t-0 lg:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:text-[11px]">
              {project.number} / {project.title}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-black/35 lg:mt-3">Selected work</p>
          </div>

          <motion.div
            aria-hidden="true"
            style={{ y: reduceMotion ? 0 : numberY }}
            className="pointer-events-none mt-14 hidden text-[8rem] font-semibold leading-none tracking-[-0.09em] text-black/[0.055] lg:block xl:text-[10rem]"
          >
            {project.number}
          </motion.div>
        </div>

        <div>
          <div className="mb-8 grid gap-7 xl:grid-cols-[1.05fr_0.68fr] xl:items-end xl:gap-14">
            <h3 className="whitespace-pre-line text-[14vw] font-medium leading-[0.84] tracking-[-0.068em] sm:text-[10vw] lg:text-[6.8vw] xl:text-[6.2rem]">
              {project.headline}
            </h3>
            <div className="pb-1 xl:pb-2">
              <p className="max-w-xl text-[15px] leading-6 text-black/58 sm:text-base sm:leading-7">{project.description}</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/42 sm:text-[10px]">
                {project.tags.map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <ProjectVisual project={project} />
        </div>
      </div>
    </motion.article>
  );
}

export default function PortfolioV2({ locale }: { locale: string }) {
  const reduceMotion = useReducedMotion();
  const cvHref = `/${locale}/cv`;
  const { scrollYProgress } = useScroll();
  const heroDrift = useTransform(scrollYProgress, [0, 0.22], [0, -85]);

  return (
    <main className="scroll-smooth bg-[#d9d6ce] text-[#171717] selection:bg-[#171717] selection:text-white" dir="ltr">
      <header className="absolute inset-x-0 top-0 z-40 px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1680px] items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]" aria-label="Portfolio navigation">
          <a href="#top" className="group flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full border border-black/25 transition-colors group-hover:bg-black group-hover:text-white">YF</span>
            <span className="hidden sm:inline">Portfolio / 2026</span>
          </a>
          <div className="flex items-center gap-5 sm:gap-8 lg:gap-10">
            <a href="#work" className="hidden border-b border-transparent pb-1 transition-colors hover:border-black/40 sm:inline">Work</a>
            <a href="#about" className="hidden border-b border-transparent pb-1 transition-colors hover:border-black/40 sm:inline">Approach</a>
            <a href={cvHref} className="border-b border-transparent pb-1 transition-colors hover:border-black/40">CV</a>
            <a href="#contact" className="rounded-full bg-[#171717] px-4 py-2 text-white transition-transform hover:-translate-y-0.5 sm:px-5">Contact</a>
          </div>
        </nav>
      </header>

      <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-6 pt-24 sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:12.5%_100%]" />
        <div className="pointer-events-none absolute -end-[12vw] top-[8vh] size-[48vw] rounded-full border border-black/[0.06]" />
        <div className="pointer-events-none absolute -end-[7vw] top-[13vh] size-[38vw] rounded-full border border-black/[0.06]" />

        <div className="relative mx-auto flex w-full max-w-[1680px] items-start justify-between gap-6 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:text-[10px]">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5" aria-hidden="true" />
            Berlin, Germany
          </div>
          <div className="text-end leading-5">
            Senior Product Engineer<br />
            Full-stack / AI / Commerce
          </div>
        </div>

        <motion.div
          style={{ y: reduceMotion ? 0 : heroDrift }}
          initial={reduceMotion ? false : { opacity: 0, y: 65 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.08, ease }}
          className="relative mx-auto flex w-full max-w-[1680px] flex-1 flex-col justify-center py-12 sm:py-16"
        >
          <div className="flex items-end justify-between gap-5">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40 sm:mb-7 sm:text-[11px]">Yotam Faraggi</p>
            <p className="mb-5 hidden max-w-[24ch] text-end text-xs leading-5 text-black/45 md:block">
              Product thinking, engineering depth, and end-to-end ownership.
            </p>
          </div>

          <h1 className="relative max-w-[10ch] text-[20vw] font-medium uppercase leading-[0.74] tracking-[-0.085em] sm:text-[16.5vw] lg:text-[13.5vw] xl:text-[12.25rem]">
            <span className="block">I build</span>
            <span className="relative ms-[8vw] block sm:ms-[11vw]">
              products<span className="text-[#7f73df]">.</span>
              <span className="absolute -end-2 top-1/2 hidden h-px w-[18vw] bg-black/25 lg:block" />
            </span>
          </h1>

          <div className="mt-9 grid gap-7 border-t border-black/20 pt-6 sm:mt-12 sm:grid-cols-[0.52fr_0.95fr_0.45fr] sm:gap-8 sm:pt-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">10+ years / production software</p>
            <p className="max-w-2xl text-xl leading-[1.18] tracking-[-0.035em] sm:text-2xl lg:text-3xl xl:text-[2rem]">
              From ambiguous ideas to production software people actually use.
            </p>
            <p className="max-w-xs text-sm leading-6 text-black/50 sm:justify-self-end">
              I move across product, frontend, backend, architecture and integrations without handing the problem off between disciplines.
            </p>
          </div>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-[1680px] items-end justify-between border-t border-black/20 pt-4 text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px]">
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#2f7d49]" />Available for the right team</span>
          <a href="#work" className="flex items-center gap-2 transition-opacity hover:opacity-55">Selected work <ArrowDown className="size-3.5" aria-hidden="true" /></a>
        </div>
      </section>

      <section id="work" className="bg-[#f2f0e9] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease }}
            className="mb-24 grid gap-10 border-b border-black/20 pb-12 sm:mb-32 lg:grid-cols-[0.28fr_0.92fr] lg:gap-12 lg:pb-16"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:text-[11px]">Selected work</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-black/30">2021 / 2026</p>
            </div>
            <div className="grid gap-8 xl:grid-cols-[1fr_0.55fr] xl:items-end">
              <h2 className="max-w-[10ch] text-5xl font-medium leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl xl:text-[7rem]">
                Different products. Same instinct to own the hard part.
              </h2>
              <p className="max-w-md text-sm leading-6 text-black/48 sm:text-base sm:leading-7">
                Selected work across digital health, commerce, AI-native software, music technology, and document automation.
              </p>
            </div>
          </motion.div>

          <div className="space-y-36 sm:space-y-48 lg:space-y-56">
            {work.map((project, index) => (
              <ProjectSection key={project.title} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden bg-[#151515] px-5 py-24 text-[#efede7] sm:px-8 sm:py-32 lg:px-12 lg:py-44">
        <div className="pointer-events-none absolute -end-[10vw] top-16 text-[28vw] font-semibold leading-none tracking-[-0.09em] text-white/[0.025]">YF</div>
        <div className="mx-auto max-w-[1680px]">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.85, ease }}>
            <div className="grid gap-8 lg:grid-cols-[0.28fr_0.92fr] lg:gap-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 sm:text-[11px]">Approach / 01</p>
              </div>
              <div>
                <h2 className="max-w-[10ch] text-[14vw] font-medium uppercase leading-[0.76] tracking-[-0.08em] sm:text-[10vw] lg:text-[7.5vw] xl:text-[8.5rem]">
                  I like owning the whole problem.
                </h2>
                <p className="mt-10 max-w-2xl text-xl leading-[1.25] tracking-[-0.025em] text-white/58 sm:text-2xl lg:ms-[34%] lg:text-3xl">
                  Good product engineering is not just writing the code. It is understanding what should exist, how it should work, and what it takes to keep it reliable after launch.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-24 grid border-t border-white/15 lg:ms-[28%] lg:mt-36 lg:grid-cols-3">
            {[
              ['01', 'Product', 'Turn unclear requirements into something concrete enough to build, test, and improve.'],
              ['02', 'Engineering', 'Move comfortably across frontend, backend, architecture, integrations, data, and production constraints.'],
              ['03', 'Shipping', 'Care about the point where the architecture diagram becomes reliable software in someone’s hands.'],
            ].map(([number, title, text], index) => (
              <motion.div
                key={title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, delay: reduceMotion ? 0 : index * 0.08, ease }}
                className="group border-b border-white/15 py-8 lg:border-b-0 lg:border-e lg:px-9 lg:py-10 first:lg:ps-0 last:lg:border-e-0 last:lg:pe-0"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/28 sm:text-[10px]">{number}</p>
                  <ArrowUpRight className="size-4 text-white/15 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white/45" aria-hidden="true" />
                </div>
                <h3 className="mt-14 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">{title}</h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/45 sm:text-base sm:leading-7">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d9d6ce] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-14 lg:grid-cols-[0.28fr_0.92fr] lg:gap-12">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:text-[11px]">Experience / selected</p>
              <h2 className="mt-8 max-w-[7ch] text-6xl font-medium uppercase leading-[0.8] tracking-[-0.07em] sm:text-8xl lg:text-[6.7rem]">Built over time.</h2>
            </div>

            <div className="border-t border-black/20">
              {experience.map((item, index) => (
                <motion.div
                  key={item.years}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.04, ease }}
                  className="group grid gap-4 border-b border-black/20 py-7 transition-colors hover:bg-black/[0.025] sm:grid-cols-[0.28fr_0.72fr_0.9fr] sm:gap-7 sm:px-3 sm:py-9"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/42 sm:text-[10px]">{item.years}</p>
                  <div>
                    <h3 className="text-2xl font-medium tracking-[-0.04em] sm:text-3xl">{item.company}</h3>
                    <p className="mt-1.5 text-xs text-black/42 sm:text-sm">{item.role}</p>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-black/50 sm:text-base sm:leading-7">{item.detail}</p>
                </motion.div>
              ))}

              <div className="flex flex-col gap-4 pt-8 text-sm text-black/46 sm:flex-row sm:items-center sm:justify-between">
                <span>Full history, technologies, education, and earlier roles live in the CV.</span>
                <a href={cvHref} className="inline-flex w-fit items-center gap-2 border-b border-black/35 pb-1 font-medium text-black transition-opacity hover:opacity-55">
                  View CV <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative overflow-hidden bg-[#8277e0] px-5 pb-8 pt-24 text-[#171717] sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 lg:pt-44">
        <div className="pointer-events-none absolute -end-20 -top-24 size-[42vw] rounded-full border border-black/10" />
        <div className="pointer-events-none absolute -end-10 -top-14 size-[34vw] rounded-full border border-black/10" />
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-8 lg:grid-cols-[0.28fr_0.92fr] lg:gap-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]">Berlin / available for the right next team</p>
            <div>
              <h2 className="max-w-[10ch] text-[14vw] font-medium uppercase leading-[0.76] tracking-[-0.08em] sm:text-[10vw] lg:text-[7.5vw] xl:text-[8.5rem]">
                Have a hard product problem?
              </h2>
              <div className="mt-12 grid gap-10 border-t border-black/20 pt-8 lg:grid-cols-[0.7fr_1fr] lg:items-end">
                <p className="max-w-xl text-3xl leading-[1.05] tracking-[-0.045em] sm:text-4xl">I like those.</p>
                <div className="flex flex-wrap gap-x-7 gap-y-4 text-[10px] font-semibold uppercase tracking-[0.17em] lg:justify-end">
                  <a href="mailto:yotamon@gmail.com" className="group inline-flex items-center gap-2 border-b border-black/40 pb-1">Email <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href="https://linkedin.com/in/yotam-faraggi" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 border-b border-black/40 pb-1">LinkedIn <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href="https://github.com/yotamon" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 border-b border-black/40 pb-1">GitHub <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href={cvHref} className="group inline-flex items-center gap-2 border-b border-black/40 pb-1">CV <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 flex items-center justify-between border-t border-black/20 pt-5 text-[9px] font-semibold uppercase tracking-[0.17em] sm:mt-32 sm:text-[10px]">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top" className="transition-opacity hover:opacity-55">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
