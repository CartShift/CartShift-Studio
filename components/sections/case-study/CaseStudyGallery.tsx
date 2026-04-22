'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from '@/lib/motion';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import type { CaseStudyGalleryItem } from '@/lib/case-studies';

interface CaseStudyGalleryProps {
  galleryItems: CaseStudyGalleryItem[];
  caseStudySlug: string;
  isHe: boolean;
  translations: {
    selectedScreens: string;
    galleryHint: string;
    previousScreen: string;
    nextScreen: string;
    openImage: string;
  };
}

const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-120px' },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const;

export const CaseStudyGallery: React.FC<CaseStudyGalleryProps> = ({
  galleryItems,
  caseStudySlug,
  isHe,
  translations,
}) => {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const galleryRailRef = React.useRef<HTMLDivElement | null>(null);
  const galleryStageRef = React.useRef<HTMLButtonElement | null>(null);

  const { scrollYProgress: galleryProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const galleryLeadY = useTransform(galleryProgress, [0, 1], [56, -18]);
  const galleryAccentY = useTransform(galleryProgress, [0, 1], [18, -30]);
  const galleryDragX = useMotionValue(0);
  const galleryDragXSmooth = useSpring(galleryDragX, {
    stiffness: 260,
    damping: 28,
    mass: 0.4,
  });
  const galleryStageRotate = useTransform(galleryDragXSmooth, [-140, 0, 140], [1.4, 0, -1.4]);
  const galleryStageScale = useTransform(galleryDragXSmooth, [-180, 0, 180], [0.988, 1, 0.988]);
  const galleryStageGlow = useTransform(galleryDragXSmooth, [-180, 0, 180], [0.22, 0.1, 0.22]);

  const [activeGalleryIndex, setActiveGalleryIndex] = React.useState(0);
  const [isGalleryPreviewOpen, setIsGalleryPreviewOpen] = React.useState(false);

  const activeGalleryItem = galleryItems[Math.min(activeGalleryIndex, galleryItems.length - 1)];
  const galleryCompletion = ((activeGalleryIndex + 1) / Math.max(galleryItems.length, 1)) * 100;

  const focusGalleryThumbnail = React.useCallback((index: number) => {
    const rail = galleryRailRef.current;
    if (!rail) return;

    const thumbnail = rail.querySelector<HTMLElement>(`[data-gallery-index="${index}"]`);
    thumbnail?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const changeActiveGallery = React.useCallback(
    (nextIndex: number) => {
      if (galleryItems.length === 0) return;

      const normalizedIndex = (nextIndex + galleryItems.length) % galleryItems.length;
      setActiveGalleryIndex(normalizedIndex);
      focusGalleryThumbnail(normalizedIndex);
    },
    [focusGalleryThumbnail, galleryItems.length]
  );

  React.useEffect(() => {
    setActiveGalleryIndex(0);
    setIsGalleryPreviewOpen(false);
    galleryDragX.set(0);
  }, [caseStudySlug, galleryDragX]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (galleryItems.length <= 1) return;
      if (isGalleryPreviewOpen) return;

      const activeElement = document.activeElement as HTMLElement | null;
      const isInsideGallery =
        !!activeElement &&
        (galleryStageRef.current?.contains(activeElement) ||
          galleryRailRef.current?.contains(activeElement) ||
          activeElement === galleryStageRef.current);

      if (!isInsideGallery) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        changeActiveGallery(isHe ? activeGalleryIndex + 1 : activeGalleryIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        changeActiveGallery(isHe ? activeGalleryIndex - 1 : activeGalleryIndex + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeGalleryIndex, changeActiveGallery, galleryItems.length, isGalleryPreviewOpen, isHe]);

  const handleGalleryDragEnd = React.useCallback(
    (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const swipeThreshold = 64;
      const velocityThreshold = 460;
      const { x: offsetX } = info.offset;
      const { x: velocityX } = info.velocity;

      if (Math.abs(offsetX) >= swipeThreshold || Math.abs(velocityX) >= velocityThreshold) {
        const movedLeft = offsetX < 0 || velocityX < 0;
        const directionStep = movedLeft ? (isHe ? -1 : 1) : isHe ? 1 : -1;

        changeActiveGallery(activeGalleryIndex + directionStep);
      }

      galleryDragX.stop();
      galleryDragX.set(0);
    },
    [activeGalleryIndex, changeActiveGallery, galleryDragX, isHe]
  );

  return (
    <section ref={sectionRef} className="bg-white py-16 dark:bg-[#07101d] md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionReveal} className="grid min-w-0 gap-5 sm:gap-6">
          <div className="min-w-0">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
                {translations.selectedScreens}
              </p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-surface-900 dark:text-white sm:text-4xl">
                {translations.selectedScreens}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                {translations.galleryHint}
              </p>
            </div>

            <div className="mt-6 rounded-[1.8rem] border bg-[rgba(var(--case-surface-rgb),0.22)] p-5 dark:border-[rgba(var(--case-dark-border-rgb),0.58)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.8)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                {activeGalleryItem && (
                  <div className="max-w-2xl">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-surface-500 dark:text-surface-400">
                      {String(activeGalleryIndex + 1).padStart(2, '0')} /{' '}
                      {String(galleryItems.length).padStart(2, '0')}
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-snug text-surface-900 dark:text-white">
                      {activeGalleryItem.caption}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                      {activeGalleryItem.alt}
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => changeActiveGallery(activeGalleryIndex - 1)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-surface-100 sm:w-auto dark:border-[rgba(var(--case-dark-border-rgb),0.58)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.88)] dark:text-white dark:hover:bg-[rgba(var(--case-dark-surface-strong-rgb),0.92)]"
                    aria-label={translations.previousScreen}
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    <span>{translations.previousScreen}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => changeActiveGallery(activeGalleryIndex + 1)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-surface-100 sm:w-auto dark:border-[rgba(var(--case-dark-border-rgb),0.58)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.88)] dark:text-white dark:hover:bg-[rgba(var(--case-dark-surface-strong-rgb),0.92)]"
                    aria-label={translations.nextScreen}
                  >
                    <span>{translations.nextScreen}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGalleryPreviewOpen(true)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border bg-[rgba(var(--case-primary-rgb),0.12)] px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-[rgba(var(--case-primary-rgb),0.18)] sm:w-auto dark:border-[rgba(var(--case-dark-border-rgb),0.62)] dark:bg-[rgba(var(--case-primary-rgb),0.22)] dark:text-white dark:hover:bg-[rgba(var(--case-primary-rgb),0.28)]"
                    style={{
                      borderColor: 'rgba(var(--case-border-rgb), 0.32)',
                    }}
                    aria-label={translations.openImage}
                  >
                    <Expand className="h-4 w-4" />
                    <span>{translations.openImage}</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-200/90 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[rgba(var(--case-primary-rgb),0.9)]"
                    initial={false}
                    animate={{ width: `${galleryCompletion}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-5 sm:gap-6">
            {activeGalleryItem && (
              <motion.div className="min-w-0" style={{ y: galleryLeadY }}>
                <div
                  className="relative overflow-hidden rounded-[1.8rem] border bg-surface-950 sm:rounded-[2.4rem] dark:border-[rgba(var(--case-dark-border-rgb),0.62)]"
                  style={{ borderColor: 'rgba(var(--case-border-rgb), 0.34)' }}
                >
                  <motion.button
                    key={`${activeGalleryItem.image}-${activeGalleryIndex}`}
                    ref={galleryStageRef}
                    type="button"
                    onClick={() => setIsGalleryPreviewOpen(true)}
                    className="group relative block w-full touch-pan-y text-start"
                    aria-label={translations.openImage}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.14}
                    dragMomentum={false}
                    onDragStart={() => galleryDragX.set(0)}
                    onDrag={(_event, info) => galleryDragX.set(info.offset.x)}
                    onDragEnd={handleGalleryDragEnd}
                    style={{
                      x: galleryDragXSmooth,
                      rotate: galleryStageRotate,
                      scale: galleryStageScale,
                    }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <div className="relative aspect-[16/10] sm:aspect-[16/9]">
                      <Image
                        src={activeGalleryItem.image}
                        alt={activeGalleryItem.alt}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        sizes="(min-width: 1024px) 62vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04)_0%,rgba(2,6,23,0.14)_40%,rgba(2,6,23,0.82)_100%)]" />
                      <motion.div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          opacity: galleryStageGlow,
                          background:
                            'radial-gradient(circle at 50% 45%, rgba(var(--case-primary-rgb), 0.2), transparent 62%)',
                        }}
                      />
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:items-center sm:p-5">
                        <div className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white/82 backdrop-blur-md">
                          {String(activeGalleryIndex + 1).padStart(2, '0')}
                        </div>
                        <div className="inline-flex max-w-[70%] items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[0.7rem] font-semibold text-white/82 backdrop-blur-md sm:max-w-none sm:text-xs">
                          <Expand className="h-3.5 w-3.5" />
                          <span className="truncate">{translations.openImage}</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6">
                        <div className="max-w-2xl rounded-[1.3rem] border border-white/10 bg-black/28 p-3 backdrop-blur-md sm:rounded-[1.6rem] sm:p-4">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/56">
                            {translations.selectedScreens}
                          </p>
                          <p className="mt-2 text-base font-semibold leading-snug text-white sm:mt-3 sm:text-xl">
                            {activeGalleryItem.caption}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            <motion.div className="relative min-w-0" style={{ y: galleryAccentY }}>
              <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-7 bg-gradient-to-r from-white via-white/88 to-transparent sm:w-12 dark:from-[#07101d] dark:via-[#07101d]/88" />
              <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-7 bg-gradient-to-l from-white via-white/88 to-transparent sm:w-12 dark:from-[#07101d] dark:via-[#07101d]/88" />
              <div
                ref={galleryRailRef}
                className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:mx-0 sm:gap-4 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {galleryItems.map((item, index) => {
                  const isActive = index === activeGalleryIndex;

                  return (
                    <motion.button
                      key={`${item.image}-thumb-${index}`}
                      type="button"
                      data-gallery-index={index}
                      onClick={() => changeActiveGallery(index)}
                      className={`group relative shrink-0 overflow-hidden rounded-[1.7rem] border text-start transition-all duration-300 ${
                        isActive
                          ? 'translate-y-0 border-[rgba(var(--case-primary-rgb),0.36)] bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.32)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.92)]'
                          : 'translate-y-2 border-[rgba(var(--case-border-rgb),0.22)] bg-white/86 opacity-82 hover:translate-y-0 hover:opacity-100 dark:border-[rgba(var(--case-dark-border-rgb),0.42)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.78)]'
                      }`}
                      style={{ width: 'min(18rem, 82vw)' }}
                      animate={{
                        y: isActive ? 0 : 8,
                        opacity: isActive ? 1 : 0.84,
                        scale: isActive ? 1 : 0.975,
                      }}
                      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={`case-study-gallery-active-${caseStudySlug}`}
                          className="absolute inset-0 z-[1] rounded-[1.7rem] border border-[rgba(var(--case-primary-rgb),0.38)] shadow-[0_24px_70px_-44px_rgba(var(--case-primary-rgb),0.9)]"
                        />
                      )}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.alt}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="(min-width: 1024px) 24rem, 82vw"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.14)_52%,rgba(2,6,23,0.82)_100%)]" />
                        <div className="absolute start-4 top-4 rounded-full border border-white/12 bg-black/28 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white/82 backdrop-blur-md">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {activeGalleryItem && (
        <ImagePreviewModal
          imageUrl={activeGalleryItem.image}
          imageName={activeGalleryItem.caption}
          isOpen={isGalleryPreviewOpen}
          onClose={() => setIsGalleryPreviewOpen(false)}
          onPrevious={() => changeActiveGallery(activeGalleryIndex - 1)}
          onNext={() => changeActiveGallery(activeGalleryIndex + 1)}
          previousLabel={translations.previousScreen}
          nextLabel={translations.nextScreen}
          counterLabel={`${String(activeGalleryIndex + 1).padStart(2, '0')} / ${String(galleryItems.length).padStart(2, '0')}`}
        />
      )}
    </section>
  );
};
