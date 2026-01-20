'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';

export { m as motion, domAnimation };

export {
  AnimatePresence,
  MotionConfig,
  useScroll,
  useTransform,
  useSpring,
  useAnimationControls,
  useInView,
  useMotionValueEvent,
  LayoutGroup,
  type Variants,
  type MotionProps,
  type MotionValue,
} from 'framer-motion';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
