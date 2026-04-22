import React from 'react';
import { Link } from '@/i18n/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center p-8', {
  variants: {
    variant: {
      default:
        'bg-surface-50/50 dark:bg-surface-900/20 border border-dashed border-surface-200 dark:border-surface-800 rounded-3xl',
      plain: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ActionButton {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
  className?: string;
  illustration?: 'activity' | 'requests' | 'files';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  variant,
  className,
  illustration,
}: EmptyStateProps) => {
  return (
    <div className={cn(emptyStateVariants({ variant }), className)}>
      {illustration ? (
        <EmptyStateIllustration variant={illustration} className="mb-4" />
      ) : (
        <div className="relative group mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl transition-transform duration-500" />
          <div className="relative w-16 h-16 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 shadow-sm flex items-center justify-center transition-transform duration-300">
            <Icon className="w-8 h-8 text-surface-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit mb-2">
        {title}
      </h3>

      <p className="text-surface-500 dark:text-surface-400 text-sm font-medium max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* Render Actions */}
      {(action || primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          {action}

          {primaryAction &&
            (primaryAction.href ? (
              <Link href={primaryAction.href}>
                <Button variant="primary" className="gap-2" onClick={primaryAction.onClick}>
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={primaryAction.onClick} className="gap-2">
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button
                  variant={secondaryAction.variant === 'ghost' ? 'ghost' : 'outline'}
                  className="gap-2"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.icon}
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant={secondaryAction.variant === 'ghost' ? 'ghost' : 'outline'}
                onClick={secondaryAction.onClick}
                className="gap-2"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};

// Column-specific empty state for Kanban boards
export function EmptyColumnState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'py-12 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-50 transition-opacity',
        className
      )}
    >
      <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center mb-3 text-surface-400">
        <Plus size={20} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">
        No items
      </span>
    </div>
  );
}

export { emptyStateVariants };
