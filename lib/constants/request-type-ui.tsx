import type { RequestType } from '@/lib/types/portal';
import { PRICING_COLORS } from '@/lib/constants/pricing';
import {
  Sparkles,
  Bug,
  Zap,
  FileText,
  Palette,
  HelpCircle,
} from 'lucide-react';

export const REQUEST_TYPE_ICONS: Record<RequestType, React.ElementType> = {
  feature: () => <span>✨</span>,
  bug: () => <span>🐛</span>,
  optimization: () => <span>⚡</span>,
  content: () => <span>📄</span>,
  design: () => <span>🎨</span>,
  other: () => <span>❓</span>,
};

export const REQUEST_TYPE_COLORS = PRICING_COLORS;

export const CALCULATOR_TYPE_ICONS: Record<RequestType, React.ElementType> = {
  feature: Sparkles,
  bug: Bug,
  optimization: Zap,
  content: FileText,
  design: Palette,
  other: HelpCircle,
};

export const CALCULATOR_TYPE_COLORS: Record<
  RequestType,
  { bg: string; text: string; border: string }
> = {
  feature: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  bug: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  optimization: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  content: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
  },
  design: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  other: {
    bg: 'bg-surface-100 dark:bg-surface-800',
    text: 'text-surface-700 dark:text-surface-300',
    border: 'border-surface-200 dark:border-surface-700',
  },
};

/** @deprecated Use REQUEST_TYPE_ICONS */
export const TYPE_ICONS = REQUEST_TYPE_ICONS;

/** @deprecated Use REQUEST_TYPE_COLORS */
export const TYPE_COLORS = REQUEST_TYPE_COLORS;
