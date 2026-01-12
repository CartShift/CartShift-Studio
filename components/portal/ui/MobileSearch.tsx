'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "@/lib/motion";
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { isRTLLocale } from '@/lib/locale-config';
import { getPortalPath } from '@/lib/utils/portal-paths';

const mobileSearchItemVariants = cva(
  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-start group",
  {
    variants: {
      variant: {
        default: "hover:bg-surface-50 dark:hover:bg-surface-800",
        active: "bg-surface-50 dark:bg-surface-800",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

const searchInputVariants = cva(
  "flex-1 bg-transparent text-surface-900 dark:text-white placeholder-surface-400 outline-none text-base",
  {
    variants: {
      hasQuery: {
        true: "font-medium",
        false: "",
      }
    },
    defaultVariants: {
      hasQuery: false,
    }
  }
);

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MobileSearch({ isOpen, onClose, className }: MobileSearchProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = isRTLLocale(locale);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches] = useState<string[]>([
    'Dashboard',
    'Requests',
    'Settings',
  ]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Simple search navigation - could be enhanced with actual search
    const normalizedQuery = searchQuery.toLowerCase().trim();

    if (normalizedQuery.includes('dashboard')) {
      router.push(getPortalPath('/dashboard/'));
    } else if (normalizedQuery.includes('request')) {
      router.push(getPortalPath('/requests/'));
    } else if (normalizedQuery.includes('setting')) {
      router.push(getPortalPath('/settings/'));
    } else if (normalizedQuery.includes('file')) {
      router.push(getPortalPath('/files/'));
    } else if (normalizedQuery.includes('team')) {
      router.push(getPortalPath('/team/'));
    }

    onClose();
    setQuery('');
  };

  const quickLinks = [
    { label: t('portal.sidebar.nav.dashboard' as any), href: getPortalPath('/dashboard/'), icon: '📊' },
    { label: t('portal.sidebar.nav.requests' as any), href: getPortalPath('/requests/'), icon: '📋' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-surface-950/60 backdrop-blur-md z-[100]"
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'fixed top-0 inset-x-0 z-[101] p-4',
              className
            )}
          >
            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden max-w-lg mx-auto">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-surface-100 dark:border-surface-800">
                <Search size={20} className="text-surface-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(query);
                    }
                  }}
                  placeholder={t('portal.header.searchPlaceholder')}
                  className={cn(searchInputVariants({ hasQuery: query.length > 0 }))}
                  aria-label="Search"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-xs font-bold"
                  aria-label="Close search"
                >
                  ESC
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query ? (
                  // Search Results
                  <div className="p-4">
                    <button
                      onClick={() => handleSearch(query)}
                      className={cn(mobileSearchItemVariants({ variant: 'default' }), "justify-between")}
                    >
                      <div className="flex items-center gap-3">
                        <Search size={16} className="text-surface-400" />
                        <span className="text-sm text-surface-700 dark:text-surface-300">
                          Search for "<span className="font-bold">{query}</span>"
                        </span>
                      </div>
                      <ArrowRight
                        size={14}
                        className={cn(
                          'text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity',
                          isRTL && 'rotate-180'
                        )}
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quick Links */}
                    <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">
                        Quick Links
                      </h3>
                      <div className="space-y-1">
                        {quickLinks.map((link) => (
                          <button
                            key={link.href}
                            onClick={() => {
                              router.push(link.href);
                              onClose();
                            }}
                            className={cn(mobileSearchItemVariants({ variant: 'default' }))}
                          >
                            <span className="text-lg">{link.icon}</span>
                            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                              {link.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="p-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
                          <Clock size={12} />
                          Recent
                        </h3>
                        <div className="space-y-1">
                          {recentSearches.map((search, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSearch(search)}
                              className={cn(mobileSearchItemVariants({ variant: 'default' }))}
                            >
                              <span className="text-sm text-surface-600 dark:text-surface-400">
                                {search}
                              </span>
                              <ArrowRight
                                size={12}
                                className={cn(
                                  'text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity ms-auto',
                                  isRTL && 'rotate-180'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


