'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from '@/lib/motion';
import { getFreshDownloadUrl } from '@/lib/services/portal-files';
import { ModalBackdrop, ModalContent } from './ModalBackdrop';

interface ImagePreviewModalProps {
  imageUrl: string;
  imageName: string;
  storagePath?: string;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  counterLabel?: string;
}

export function ImagePreviewModal({
  imageUrl,
  imageName,
  storagePath,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  counterLabel,
}: ImagePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [imageError, setImageError] = useState(false);
  const dragX = useMotionValue(0);
  const dragXSmooth = useSpring(dragX, {
    stiffness: 260,
    damping: 28,
    mass: 0.42,
  });
  const dragRotate = useTransform(dragXSmooth, [-140, 0, 140], [1.2, 0, -1.2]);
  const dragScale = useTransform(dragXSmooth, [-200, 0, 200], [0.985, 1, 0.985]);
  const dragGlow = useTransform(dragXSmooth, [-200, 0, 200], [0.26, 0.1, 0.26]);
  const canNavigate = Boolean(onPrevious && onNext) && zoom <= 1.05;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentImageUrl(imageUrl);
    setImageError(false);
    setZoom(1);
    dragX.set(0);
  }, [dragX, imageUrl, isOpen]);

  const handleImageError = async () => {
    if (imageError || !storagePath) {
      setImageError(true);
      return;
    }

    setImageError(true);
    try {
      const freshUrl = await getFreshDownloadUrl(storagePath);
      if (freshUrl) {
        setCurrentImageUrl(freshUrl);
        setImageError(false);
      }
    } catch (error) {
      console.error('Error getting fresh download URL for preview:', error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && onPrevious) onPrevious();
      if (event.key === 'ArrowRight' && onNext) onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!mounted) return null;

  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    if (!canNavigate) {
      dragX.set(0);
      return;
    }

    const swipeThreshold = 70;
    const velocityThreshold = 500;
    const { x: offsetX } = info.offset;
    const { x: velocityX } = info.velocity;

    if (Math.abs(offsetX) >= swipeThreshold || Math.abs(velocityX) >= velocityThreshold) {
      if (offsetX < 0 || velocityX < 0) {
        onNext?.();
      } else {
        onPrevious?.();
      }
    }

    dragX.set(0);
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose} variant="dark" blur="sm" zIndex="100">
      <ModalContent
        maxWidth="full"
        position="top"
        className="inset-0 flex h-[100dvh] max-w-none flex-col rounded-none border-0 bg-[#020617]/96 p-0 shadow-none"
      >
        <div className="border-b border-white/10 px-3 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <h3 className="truncate font-outfit text-base font-bold text-white sm:text-lg">
                {imageName}
              </h3>
              {counterLabel && (
                <span className="hidden rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white/72 sm:inline-flex">
                  {counterLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onPrevious && onNext && (
                <>
                  <button
                    onClick={onPrevious}
                    className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                    title={previousLabel}
                    aria-label={previousLabel}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={onNext}
                    className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                    title={nextLabel}
                    aria-label={nextLabel}
                  >
                    <ArrowRight size={18} />
                  </button>
                </>
              )}
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="px-2 text-sm font-bold text-white">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>

              {currentImageUrl && (
                <a
                  href={currentImageUrl}
                  download={imageName}
                  className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                  title="Download"
                >
                  <Download size={18} />
                </a>
              )}

              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden bg-surface-950/50">
          {counterLabel && (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap items-center justify-between gap-3">
              {counterLabel && (
                <span className="rounded-full border border-white/12 bg-black/28 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white/80 backdrop-blur-md sm:hidden">
                  {counterLabel}
                </span>
              )}
            </div>
          )}
          {imageError && !storagePath ? (
            <div className="p-8 text-center text-white/60">
              <p className="text-sm">Failed to load image</p>
            </div>
          ) : !currentImageUrl ? (
            <div className="p-8 text-center text-white/60">
              <p className="text-sm">No image URL provided</p>
            </div>
          ) : (
            <motion.div
              className="relative flex h-full min-h-0 items-center justify-center overflow-auto p-4 sm:p-8"
              drag={canNavigate ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.14}
              dragMomentum={false}
              onDragStart={() => dragX.set(0)}
              onDrag={(_event, info) => dragX.set(info.offset.x)}
              onDragEnd={handleDragEnd}
              style={{ x: dragXSmooth, rotate: dragRotate, scale: dragScale }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: dragGlow,
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.12), transparent 62%)',
                }}
              />
              <motion.img
                src={currentImageUrl}
                alt={imageName}
                className="relative z-[1] max-h-full max-w-full rounded-xl object-contain shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
                style={{
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s ease-out',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                onError={handleImageError}
              />
            </motion.div>
          )}
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
