import { cva } from 'class-variance-authority';

export const starVariants = cva('cursor-pointer transition-all duration-200 stroke-[1.5]', {
  variants: {
    state: {
      empty:
        'text-surface-300 dark:text-surface-600 hover:text-amber-400 dark:hover:text-amber-400',
      filled: 'text-amber-400 fill-amber-400',
      hovered: 'text-amber-300 fill-amber-300',
    },
    size: {
      sm: 'w-5 h-5',
      md: 'w-7 h-7',
      lg: 'w-9 h-9',
    },
  },
  defaultVariants: {
    state: 'empty',
    size: 'md',
  },
});

export const aspectCardVariants = cva(
  'relative rounded-xl p-3 transition-all duration-200 cursor-pointer',
  {
    variants: {
      selected: {
        true: [
          'bg-surface-50 dark:bg-surface-900/50',
          'border-2 border-primary-300 dark:border-primary-600',
          'shadow-md shadow-primary-500/10',
        ],
        false: [
          'bg-surface-50 dark:bg-surface-800/50',
          'border border-surface-200 dark:border-surface-700',
          'hover:border-primary-200 dark:hover:border-primary-800',
          'hover:bg-surface-100 dark:hover:bg-surface-800',
        ],
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);
