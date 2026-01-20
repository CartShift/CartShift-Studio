'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, MotionValue, useSpring } from '@/lib/motion';

/**
 * Hook: useParallax - Returns parallax motion values based on viewport scroll
 */
export function useParallax(
  speed: number = 0.5,
  direction: 'vertical' | 'horizontal' = 'vertical'
) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = 100 * speed;
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [-range, range]), {
    stiffness: 100,
    damping: 30,
  });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [-range, range]), {
    stiffness: 100,
    damping: 30,
  });

  return {
    ref,
    style: direction === 'vertical' ? { y } : { x },
  };
}

/**
 * Hook: useParallaxLayer - Returns layered depth parallax values
 */
export function useParallaxLayer(depth: number = 1, baseSpeed: number = 0.1) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const speed = baseSpeed * depth;
  const range = 100 * speed;

  const y = useSpring(useTransform(scrollYProgress, [0, 1], [range, -range]), {
    stiffness: 100,
    damping: 30,
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1 - depth * 0.01, 1, 1 + depth * 0.01]);

  return {
    ref,
    style: { y, scale },
  };
}

// Simple parallax component - for non-absolute positioned elements
interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className = '',
  speed = 0.5,
  direction = 'vertical',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Force consistent hook order - always call useLayoutEffect before useScroll
    // This prevents framer-motion's useScroll from switching between useEffect and useLayoutEffect
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = 80 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);
  const x = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <motion.div ref={ref} style={direction === 'vertical' ? { y } : { x }} className={className}>
      {children}
    </motion.div>
  );
};

// ParallaxLayer component for depth effects
interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  baseSpeed?: number;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  className = '',
  depth = 1,
  baseSpeed = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const speed = baseSpeed * depth;
  // Subtle but visible depth range
  const range = 120 * speed;

  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1 - depth * 0.02, 1, 1 + depth * 0.02]);

  return (
    <motion.div ref={ref} style={{ y, scale }} className={className}>
      {children}
    </motion.div>
  );
};

interface ParallaxTextProps {
  children: React.ReactNode;
  className?: string;
  type?: 'fade-up' | 'slide-in' | 'scale';
}

export const ParallaxText: React.FC<ParallaxTextProps> = ({
  children,
  className = '',
  type = 'fade-up',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.4'],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const animations: Record<
    string,
    { y?: MotionValue<number>; x?: MotionValue<number>; scale?: MotionValue<number> }
  > = {
    'fade-up': { y: useTransform(scrollYProgress, [0, 1], [50, 0]) },
    'slide-in': { x: useTransform(scrollYProgress, [0, 1], [-100, 0]) },
    scale: { scale: useTransform(scrollYProgress, [0, 1], [0.8, 1]) },
  };

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ opacity, ...animations[type] }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  delay?: number;
  rotate?: boolean;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  amplitude = 20,
  duration = 6,
  delay = 0,
  rotate = false,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0],
        ...(rotate && { rotate: [0, 5, -5, 0] }),
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};
