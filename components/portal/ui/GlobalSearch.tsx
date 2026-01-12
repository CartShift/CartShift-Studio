'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Request, CLIENT_STATUS_MAP } from '@/lib/types/portal';
import { subscribeToOrgRequests, subscribeToAllRequests } from '@/lib/services/portal-requests';
import { PortalBadge } from './PortalBadge';
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { getPortalPath } from '@/lib/utils/portal-paths';

const searchInputVariants = cva(
  "w-full h-10 ps-12 pe-12 bg-surface-50/50 dark:bg-surface-900/50 border border-surface-200/50 dark:border-surface-800/30 rounded-xl focus:outline-none focus:ring-2 transition-all group-hover:bg-surface-100/50 dark:group-hover:bg-surface-800/50 text-sm font-medium",
  {
    variants: {
      isFocused: {
        true: "focus:ring-blue-500/20 focus:border-blue-500",
        false: "",
      }
    },
    defaultVariants: {
      isFocused: false,
    }
  }
);

const searchItemVariants = cva(
  "w-full text-start flex items-center gap-3 p-2.5 rounded-lg transition-colors group/item relative",
  {
    variants: {
      isActive: {
        true: "bg-blue-50 dark:bg-blue-900/20",
        false: "hover:bg-surface-50 dark:hover:bg-surface-800",
      }
    },
    defaultVariants: {
      isActive: false,
    }
  }
);

const itemIconVariants = cva(
  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
  {
    variants: {
      isActive: {
        true: "bg-blue-100 dark:bg-blue-900/40 text-blue-600",
        false: "bg-surface-100 dark:bg-surface-800 text-surface-500",
      }
    },
    defaultVariants: {
      isActive: false,
    }
  }
);

interface GlobalSearchProps {
  orgId?: string;
  isAgency?: boolean;
  className?: string;
}

export function GlobalSearch({ orgId, isAgency = false, className }: GlobalSearchProps) {
  const router = useRouter();
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredResults, setFilteredResults] = useState<Request[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to data once on mount (or when deps change)
  useEffect(() => {
    if ((!orgId && !isAgency)) return;

    setLoading(true);
    let unsubscribe: () => void;

    const handleData = (data: Request[]) => {
      setRequests(data);
      setLoading(false);
    };

    if (isAgency) {
      unsubscribe = subscribeToAllRequests(handleData);
    } else if (orgId) {
      unsubscribe = subscribeToOrgRequests(orgId, handleData);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orgId, isAgency]);

  // Global Shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Filter results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setFilteredResults([]);
      setActiveIndex(-1);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const results = requests.filter(req =>
      (req.title?.toLowerCase() || '').includes(searchTerm) ||
      (req.id?.toLowerCase() || '').includes(searchTerm) ||
      (req.description?.toLowerCase() || '').includes(searchTerm)
    ).slice(0, 5); // Limit to top 5 results

    setFilteredResults(results);
    setIsOpen(true);
    setActiveIndex(0); // Auto-select first result
  }, [query, requests]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (req: Request) => {
    setIsOpen(false);
    setQuery('');
    router.push(getPortalPath(`/requests/${req.id}/`));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredResults.length) {
        handleSelect(filteredResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative group", className)}>
      <Search
        className={cn(
          "absolute start-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
          isFocused ? "text-blue-500" : "text-surface-400"
        )}
        size={18}
      />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim()) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t('portal.header.search')}
          className={cn(searchInputVariants({ isFocused }))}
          aria-label="Search"
        />
        <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
             <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-1.5 font-mono text-[10px] font-medium text-surface-500">
               <span className="text-xs">⌘</span>K
             </kbd>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full start-0 end-0 mt-2 bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden z-50 p-2"
          >
            {filteredResults.length > 0 ? (
              <>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-3 py-2 mb-1 flex justify-between">
                  <span>Requests</span>
                  <span className="text-[9px] opacity-60">Use ↑↓ to navigate</span>
                </div>
                {filteredResults.map((req, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={req.id}
                      onClick={() => handleSelect(req)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(searchItemVariants({ isActive }))}
                    >
                      {isActive && (
                          <motion.div
                              layoutId="active-search-item"
                              className="absolute start-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full"
                          />
                      )}
                      <div className={cn(itemIconVariants({ isActive }))}>
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                              "font-bold text-sm truncate",
                              isActive ? "text-blue-700 dark:text-blue-300" : "text-surface-900 dark:text-white"
                          )}>
                            {req.title}
                          </span>
                          <PortalBadge
                            variant={isAgency
                              ? getStatusBadgeVariant(req.status)
                              : getClientStatusBadgeVariant(req.status)
                            }
                            className="text-[9px] h-4 px-1.5"
                          >
                            {isAgency
                              ? t(`portal.requests.status.${req.status.toLowerCase()}` as any)
                              : t(`portal.requests.clientStatus.${CLIENT_STATUS_MAP[req.status].toLowerCase()}` as any)
                            }
                          </PortalBadge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-surface-500">
                          <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded text-[10px]">
                              {req.id.slice(0, 8)}
                          </span>
                          {isAgency && (
                              <span className="truncate max-w-[100px] opacity-75">
                                  • {req.orgId}
                              </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className={cn(
                          "transition-opacity",
                          isActive ? "text-blue-400 opacity-100" : "text-surface-300 opacity-0 group-hover/item:opacity-100"
                      )} />
                    </button>
                  );
                })}
              </>
            ) : (
                <div className="p-8 text-center text-surface-500">
                    <p className="text-sm font-medium">No results found for "{query}"</p>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
