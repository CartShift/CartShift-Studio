'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, X } from 'lucide-react';
import type { PortfolioShowcaseProject, ShowcaseMedia } from '@/lib/portfolio-showcase';

type Props = {
  project: PortfolioShowcaseProject;
  nextProject: PortfolioShowcaseProject | null;
  locale: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

function ProductImage({ media, eager = false, className = '' }: { media: ShowcaseMedia; eager?: boolean; className?: string }) {
  return (
    // Native img supports both local portfolio assets and public product evidence hosted in GitHub.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.src}
      alt={media.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`${media.contain ? 'object-contain' : 'object-cover'} ${className}`}
    />
  );
}

function MediaFrame({ media, onOpen, featured = false, isHebrew = false }: { media: ShowcaseMedia; onOpen: () => void; featured?: boolean; isHebrew?: boolean }) {
  const portrait = media.aspect === 'portrait';

  return (
    <figure className={portrait ? 'mx-auto w-full max-w-[31rem]' : 'w-full'}>
      <button
        type="button"
        onClick={onOpen}
        className={`group relative block w-full overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8] ${
          portrait
            ? 'aspect-[9/16] rounded-[2rem] bg-[#171719] p-3 shadow-[0_32px_90px_rgba(0,0,0,.16)] sm:p-4'
            : featured
              ? 'aspect-[16/10] bg-white shadow-[0_40px_120px_rgba(25,25,27,.13)]'
              : 'aspect-[16/10] bg-white shadow-[0_28px_80px_rgba(25,25,27,.11)]'
        }`}
        aria-label={`${isHebrew ? 'פתיחת' : 'Open'} ${media.label}`}
      >
        <ProductImage
          media={media}
          eager={featured}
          className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.012] ${portrait ? 'rounded-[1.35rem]' : 'p-2 sm:p-4 lg:p-6'}`}
        />
        <span className="absolute end-3 top-3 rounded-full border border-black/10 bg-white/86 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-black/65 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 sm:end-5 sm:top-5">
          {isHebrew ? 'מסך מלא' : 'Full screen'}
        </span>
      </button>
      <figcaption className="mt-4 grid gap-2 sm:grid-cols-[0.28fr_0.72fr] sm:gap-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/48">{media.label}</p>
        <p className="max-w-2xl text-[12px] leading-5 text-black/62 sm:text-sm sm:leading-6">{media.caption}</p>
      </figcaption>
    </figure>
  );
}

function ConceptStage({ project, isHebrew }: { project: PortfolioShowcaseProject; isHebrew: boolean }) {
  return (
    <div className="relative min-h-[60vh] overflow-hidden bg-[#151517] p-6 text-white sm:p-10 lg:min-h-[72vh] lg:p-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: `radial-gradient(circle at 72% 20%, ${project.accent}55, transparent 38%), radial-gradient(circle at 15% 85%, ${project.accent}25, transparent 34%)` }}
      />
      <div className="relative flex min-h-[inherit] flex-col justify-between">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          <span>{project.title}</span>
          <span>{project.status}</span>
        </div>
        <p className="max-w-[8ch] py-16 text-[18vw] font-medium leading-[0.72] tracking-[-0.075em] sm:py-24 sm:text-[9vw] lg:text-[7.2rem]">
          {isHebrew ? 'ריליסים. תוכן. קהל.' : 'Releases. Content. Audience.'}
        </p>
        <div className="grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          {project.highlights.map((item, index) => (
            <div key={item} className="border-t border-white/12 py-4 sm:border-s sm:border-t-0 sm:ps-5 first:sm:border-s-0 first:sm:ps-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/38">0{index + 1}</p>
              <p className="mt-2 text-sm text-white/78 sm:text-base">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectShowcase({ project, nextProject, locale }: Props) {
  const isHebrew = locale === 'he';
  const reduceMotion = useReducedMotion();
  const [activeMedia, setActiveMedia] = useState<ShowcaseMedia | null>(null);
  const portfolioHref = `/${locale}/portfolio`;
  const cvHref = `/${locale}/cv`;
  const nextHref = nextProject ? `/${locale}/portfolio/${nextProject.slug}` : portfolioHref;

  useEffect(() => {
    if (!activeMedia) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMedia(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeMedia]);

  const reveal = reduceMotion
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 34 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.68, ease },
      };

  const themeStyle = {
    '--project-accent': project.accent,
    '--project-accent-soft': project.accentSoft,
  } as CSSProperties;

  return (
    <main
      dir={isHebrew ? 'rtl' : 'ltr'}
      style={themeStyle}
      className="overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[var(--project-accent)] selection:text-white"
    >
      <header className="absolute inset-x-0 top-0 z-40 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]" aria-label={isHebrew ? 'ניווט בפרויקט' : 'Project navigation'}>
          <a href={portfolioHref} className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="text-white/45">©</span>
            <span className="transition-opacity group-hover:opacity-60">Yotam Faraggi</span>
          </a>
          <div className="flex items-center gap-4 sm:gap-7">
            <a href={portfolioHref} className="hidden transition-opacity hover:opacity-60 sm:inline">{isHebrew ? 'פורטפוליו' : 'Portfolio'}</a>
            <a href={cvHref} className="hidden transition-opacity hover:opacity-60 sm:inline">CV</a>
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 transition-colors hover:bg-white hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <span>{isHebrew ? 'למוצר' : 'Live product'}</span><ArrowUpRight className="size-3.5" />
              </a>
            ) : (
              <span className="rounded-full border border-white/18 px-4 py-2.5 text-white/58">{project.status}</span>
            )}
          </div>
        </nav>
      </header>

      <section className="relative min-h-[82svh] overflow-hidden bg-[#171719] px-5 pb-10 pt-28 text-white sm:min-h-[88svh] sm:px-8 sm:pb-12 sm:pt-32 lg:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 82% 18%, ${project.accent}45, transparent 32%), radial-gradient(circle at 16% 82%, ${project.accent}20, transparent 34%)` }} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(23,23,25,.15)_45%,#171719_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(82svh-9rem)] max-w-[1680px] flex-col sm:min-h-[calc(88svh-10rem)]">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:text-[10px]">
            <span>{project.number} / {isHebrew ? 'פרויקט נבחר' : 'Selected work'}</span>
            <span className="text-end">{project.descriptor}<br />{project.year}</span>
          </div>
          <div className="mt-auto grid items-end gap-10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.33fr)] lg:gap-14">
            <div>
              <motion.p initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/48 sm:text-[10px]">{project.status}</motion.p>
              <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 46 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.86, ease }} className="text-[19vw] font-medium leading-[0.72] tracking-[-0.078em] sm:text-[12vw] lg:text-[9vw] xl:text-[9rem]" dir="ltr">{project.title}</motion.h1>
            </div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, delay: 0.08, ease }} className="border-t border-white/18 pt-5">
              <p className="text-base leading-7 text-white/70 sm:text-lg">{project.summary}</p>
              <p className="mt-5 text-[9px] font-semibold uppercase leading-5 tracking-[0.14em] text-white/45">{project.role}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal}>
            {project.hero ? (
              <div className={project.hero.aspect === 'portrait' ? 'mx-auto max-w-[56rem] bg-[var(--project-accent-soft)] px-6 py-12 sm:px-12 sm:py-16 lg:py-20' : 'bg-[var(--project-accent-soft)] p-3 sm:p-5 lg:p-7'}>
                <MediaFrame media={project.hero} onOpen={() => setActiveMedia(project.hero)} featured isHebrew={isHebrew} />
              </div>
            ) : (
              <ConceptStage project={project} isHebrew={isHebrew} />
            )}
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/48 sm:text-[10px]">01 / {isHebrew ? 'המוצר' : 'The product'}</p>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,.95fr)_minmax(17rem,.55fr)] lg:gap-20">
            <div>
              <h2 className="max-w-[12ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.4vw] xl:text-[5.4rem]">{project.descriptor}</h2>
              <p className="mt-8 max-w-3xl text-lg leading-7 text-black/68 sm:text-2xl sm:leading-9">{project.summary}</p>
            </div>
            <div className="border-t border-black/20">
              <div className="grid grid-cols-[0.32fr_0.68fr] gap-4 border-b border-black/20 py-5 text-[11px] leading-5 sm:text-xs"><span className="font-semibold uppercase tracking-[0.12em] text-black/45">{isHebrew ? 'למי' : 'Built for'}</span><span className="text-black/68">{project.audience}</span></div>
              <div className="grid grid-cols-[0.32fr_0.68fr] gap-4 border-b border-black/20 py-5 text-[11px] leading-5 sm:text-xs"><span className="font-semibold uppercase tracking-[0.12em] text-black/45">{isHebrew ? 'התפקיד שלי' : 'My role'}</span><span className="text-black/68">{project.role}</span></div>
              <div className="py-6">
                {project.highlights.map((highlight, index) => (
                  <div key={highlight} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-black/12 py-3 last:border-b-0"><span className="text-[8px] font-semibold tracking-[0.15em] text-black/38">0{index + 1}</span><span className="text-sm text-black/70">{highlight}</span></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {project.gallery.length > 0 ? (
        <section className="bg-[#d9d5cc] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1680px]">
            <motion.div {...reveal} className="mb-12 grid gap-6 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-16">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/48 sm:text-[10px]">02 / {isHebrew ? 'בתוך המוצר' : 'Inside the product'}</p>
              <h2 className="max-w-[10ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.4vw] xl:text-[5.4rem]">{isHebrew ? 'המוצר מדבר בעד עצמו.' : 'Let the product speak.'}</h2>
            </motion.div>
            <div className={project.gallery.every(item => item.aspect === 'portrait') ? 'grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10' : 'space-y-20 sm:space-y-28'}>
              {project.gallery.map((media, index) => (
                <motion.div key={`${media.src}-${index}`} {...reveal} className={media.aspect === 'portrait' ? '' : index % 2 === 1 ? 'lg:ms-[14%] lg:w-[86%]' : 'lg:me-[10%] lg:w-[90%]'}>
                  <MediaFrame media={media} onOpen={() => setActiveMedia(media)} isHebrew={isHebrew} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#19191b] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:text-[10px]">03 / Technology</p>
            <div>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-[10vw] font-medium leading-[0.88] tracking-[-0.06em] sm:text-[5vw] lg:text-[4vw] xl:text-[4rem]">
                {project.technologies.map((technology, index) => <span key={technology}>{technology}{index < project.technologies.length - 1 ? <span className="ms-3 text-white/20">·</span> : null}</span>)}
              </div>
              <div className="mt-12 flex flex-col gap-8 border-t border-white/16 pt-7 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/42">{isHebrew ? 'התפקיד שלי' : 'My role'}</p><p className="mt-3 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">{project.role}</p></div>
                <div className="flex flex-wrap gap-3">
                  {project.repositoryUrl ? <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-black"><Github className="size-4" /> GitHub</a> : null}
                  {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition-transform hover:scale-[1.02]">{isHebrew ? 'פתיחת המוצר' : 'Open product'} <ArrowUpRight className="size-4" /></a> : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {nextProject ? (
        <a href={nextHref} className="group block overflow-hidden bg-[var(--project-accent)] px-5 py-20 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white sm:px-8 sm:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1680px]">
            <div className="flex items-center justify-between border-b border-white/25 pb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/68 sm:text-[10px]"><span>{nextProject.number} / {isHebrew ? 'הפרויקט הבא' : 'Next project'}</span><ArrowRight className={`size-5 transition-transform duration-300 group-hover:translate-x-2 ${isHebrew ? 'rotate-180 group-hover:-translate-x-2' : ''}`} /></div>
            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_.34fr] lg:items-end"><h2 className="text-[18vw] font-medium leading-[0.72] tracking-[-0.078em] sm:text-[11vw] lg:text-[8.5vw] xl:text-[8.5rem]" dir="ltr">{nextProject.title}</h2><div className="lg:pb-2"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/55">{nextProject.descriptor}</p><p className="mt-4 max-w-md text-base leading-7 text-white/78">{nextProject.summary}</p></div></div>
          </div>
        </a>
      ) : null}

      <footer className="bg-[#171719] px-5 py-6 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between text-[8px] font-semibold uppercase tracking-[0.16em] text-white/48 sm:text-[9px]"><a href={portfolioHref} className="inline-flex items-center gap-2 transition-colors hover:text-white"><ArrowLeft className={`size-3.5 ${isHebrew ? 'rotate-180' : ''}`} />{isHebrew ? 'כל הפרויקטים' : 'All projects'}</a><span>Yotam Faraggi © 2026</span></div>
      </footer>

      <AnimatePresence>
        {activeMedia ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={activeMedia.label} onClick={() => setActiveMedia(null)}>
            <button type="button" onClick={() => setActiveMedia(null)} className="absolute end-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:end-7 sm:top-7" aria-label={isHebrew ? 'סגירה' : 'Close'}><X className="size-5" /></button>
            <motion.div initial={reduceMotion ? false : { scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={reduceMotion ? undefined : { scale: 0.98, y: 8 }} transition={{ duration: 0.35, ease }} className={`relative flex max-h-[90vh] max-w-[94vw] items-center justify-center ${activeMedia.aspect === 'portrait' ? 'h-[88vh] w-auto' : 'w-[94vw]'}`} onClick={event => event.stopPropagation()}>
              <ProductImage media={activeMedia} className="max-h-[90vh] max-w-full object-contain" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
