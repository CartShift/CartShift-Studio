'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const themeToggleVariants = cva('relative p-2 rounded-xl transition-all duration-200', {
  variants: {
    isDark: {
      true: 'hover:bg-surface-700/50 text-surface-300',
      false: 'hover:bg-surface-200/60 text-surface-600',
    },
  },
  defaultVariants: {
    isDark: false,
  },
});

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(themeToggleVariants({ isDark: false }), className)}
        aria-label="Toggle theme"
      >
        <div className="relative w-6 h-6" />
      </button>
    );
  }

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(themeToggleVariants({ isDark }), className)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="text-amber-500" size={24} />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="text-accent-400" size={24} />
        </motion.div>
      </div>
    </button>
  );
};
