import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva('rounded-full object-cover shrink-0', {
  variants: {
    size: {
      xs: 'w-5 h-5 text-[9px]',
      sm: 'w-7 h-7 text-[10px]',
      md: 'w-9 h-9 text-xs',
      lg: 'w-11 h-11 text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name?: string;
  src?: string;
  className?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({ name, src, size, className }) => {
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
        .substring(0, 2)
    : '?';

  // Generate consistent color if name is provided, otherwise fallback to primary
  const bgColor = name ? getAvatarColor(name) : 'bg-primary-500';

  if (src) {
    return (
      <img src={src} alt={name || 'Avatar'} className={cn(avatarVariants({ size }), className)} />
    );
  }

  return (
    <div
      className={cn(
        avatarVariants({ size }),
        'flex items-center justify-center font-semibold text-white',
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
};

export { avatarVariants };

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ children, max = 4, className }) => {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const overflow = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren}
      {overflow > 0 && (
        <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs flex items-center justify-center border-2 border-white dark:border-surface-800">
          +{overflow}
        </div>
      )}
    </div>
  );
};
