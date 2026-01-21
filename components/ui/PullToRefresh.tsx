'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimationControls } from '@/lib/motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentControls = useAnimationControls();
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Don't enable on desktop or if disabled
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice || disabled) return <>{children}</>;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return; // Only trigger if at top
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    // If user scrolled down and then back up, don't trigger
    if (window.scrollY > 0) {
      isDragging.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;

    // Only pull down logic
    if (delta > 0) {
      // Add resistance
      const pull = Math.min(delta * 0.4, threshold * 1.5);
      setPullProgress(pull);
      contentControls.set({ y: pull });

      // Prevent browser refresh if we are capturing the pull
      if (e.cancelable && pull > 10) e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullProgress >= threshold) {
      setIsRefreshing(true);
      // Snap to threshold
      contentControls.start({ y: threshold });

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        contentControls.start({ y: 0 });
      }
    } else {
      // Snap back
      setPullProgress(0);
      contentControls.start({ y: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator */}
      <div
        className="absolute top-0 start-0 end-0 flex justify-center items-start pointer-events-none"
        style={{ height: threshold }}
      >
        <motion.div
          className="mt-4 p-2 rounded-full bg-white dark:bg-surface-800 shadow-md border border-surface-200 dark:border-surface-700"
          style={{
            opacity: Math.min(pullProgress / threshold, 1),
            rotate: pullProgress * 2,
            scale: Math.min(pullProgress / threshold, 1),
          }}
        >
          <Loader2 className={`w-5 h-5 text-primary-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.div>
      </div>

      <motion.div animate={contentControls}>{children}</motion.div>
    </div>
  );
}
