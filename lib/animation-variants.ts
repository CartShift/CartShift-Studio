import { type Variants } from '@/lib/motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const scaleInLarge: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const card: Variants = {
  idle: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const slideInFromTop: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

export const dropdown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

export const heroTag: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' },
  },
};

export const heroContent: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

export const heroImage: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1, delay: 0.4, type: 'spring', stiffness: 50 },
  },
};

export const platformIcon: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const statCard: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, type: 'spring', stiffness: 100 },
  },
};

export const faqItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const accordion: Variants = {
  closed: { height: 0, opacity: 0 },
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const buttonState: Variants = {
  idle: {},
  loading: {},
  success: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300 },
  },
  error: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300 },
  },
};

export const geometricShape = {
  pulse: {
    scale: [1, 1.5, 1],
    opacity: [0.2, 0.5, 0.2],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
  rotate: {
    rotate: [0, 360],
    transition: { duration: 20, repeat: Infinity, ease: 'linear' },
  },
  rotateReverse: {
    rotate: [0, -360],
    transition: { duration: 20, repeat: Infinity, ease: 'linear' },
  },
  float: {
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
  floatX: {
    x: [0, 15, 0],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
  },
  scaleAndRotate: {
    rotate: [0, 90, 180, 270, 360],
    scale: [1, 1.1, 1],
    transition: { duration: 12, repeat: Infinity, ease: 'linear' },
  },
  complexFloat: {
    y: [0, -15, 0],
    x: [0, 8, 0],
    opacity: [0.15, 0.4, 0.15],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
  wobble: {
    rotate: [0, 5, -5, 0],
    y: [0, -10, 0],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const skeletonToContent: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const toastSlideIn: Variants = {
  hidden: { opacity: 0, x: 100, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const errorShake: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      y: { duration: 0.3 },
      x: { duration: 0.4, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const sidebarSlide: Variants = {
  closed: { x: -300 },
  open: {
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
};

export const progressBar: Variants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: { duration: 0.8, ease: 'easeOut' },
  }),
};

export const timelineItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const timelineItemRTL: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const analyticsCard: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const kanbanCard: Variants = {
  idle: { scale: 1, rotate: 0 },
  dragging: {
    scale: 1.05,
    rotate: 2,
    cursor: 'grabbing',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 },
  },
};

export const pinnedItemHighlight: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  pinned: {
    scale: [1, 1.03, 1],
    opacity: [1, 1, 1],
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      times: [0, 0.5, 1],
    },
  },
};

export const listItemLayout: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};
