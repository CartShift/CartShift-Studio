'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  LayoutDashboard,
  LayoutList,
  Users,
  Plus,
  Settings,
  CreditCard,
  FileText,
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Request } from '@/lib/types/portal';
import { subscribeToOrgRequests } from '@/lib/services/portal-requests';
import { Logger } from '@/lib/logger';

interface CommandItemProps {
  icon: React.ElementType;
  label: string;
  onSelect: () => void;
  active: boolean;
  shortcut?: string;
}

const CommandItem = ({ icon: Icon, label, onSelect, active, shortcut }: CommandItemProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors',
        active
          ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white'
          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={cn(active ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400')}
        />
        <span className="font-medium">{label}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-surface-400 bg-surface-200 dark:bg-surface-700 px-1.5 py-0.5 rounded">
          {shortcut}
        </span>
      )}
    </button>
  );
};

interface CommandPaletteProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ isOpen: externalIsOpen, onOpenChange }: CommandPaletteProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof externalIsOpen !== 'undefined';
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const t = useTranslations();
  const orgId = useResolvedOrgId();
  const { isAgency } = usePortalAuth();
  const [requests, setRequests] = useState<Request[]>([]);

  // Subscribe to requests
  useEffect(() => {
    if (!orgId) return;

    let unsubscribe: (() => void) | undefined;

    const handleData = (data: Request[]) => {
      setRequests(data);
    };

    const setupSubscription = async () => {
      try {
        const { waitForAuth } = await import('@/lib/firebase');
        await waitForAuth();

        // Using orgId if available, or assume Agency mode might need all requests or handled by orgId logic
        // For now simpler to just use orgId subscription as CommandPalette usually in context of org/agency
        unsubscribe = subscribeToOrgRequests(orgId, handleData);
      } catch (error) {
        Logger.error('Error in CommandPalette subscription', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orgId]);

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenChange(!isOpen);
        setQuery('');
        setActiveIndex(0);
      }

      if (e.key === 'Escape') {
        handleOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = useMemo(() => {
    if (!orgId) return [];

    const actionItems = [
      {
        icon: Plus,
        label: t('portal.quickActions.newRequest'),
        path: getPortalPath('/requests/new/'),
        keywords: ['new', 'create', 'request'],
      },
    ];
    if (isAgency) {
      actionItems.push({
        icon: Users,
        label: t('portal.commandPalette.items.addClient'),
        path: getPortalPath('/agency/clients/new'),
        keywords: ['add', 'client', 'agency'],
      });
    }

    const navItems = [
      {
        icon: LayoutDashboard,
        label: t('portal.commandPalette.items.dashboard'),
        path: getPortalPath('/dashboard'),
        keywords: ['home', 'main'],
      },
      {
        icon: Settings,
        label: t('portal.commandPalette.items.settings'),
        path: getPortalPath('/settings/profile'),
        keywords: ['profile', 'account', 'preferences'],
      },
    ];
    if (isAgency) {
      navItems.splice(
        1,
        0,
        {
          icon: LayoutList,
          label: t('portal.commandPalette.items.workboard'),
          path: getPortalPath('/agency/workboard'),
          keywords: ['kanban', 'requests', 'tasks'],
        },
        {
          icon: Users,
          label: t('portal.commandPalette.items.clients'),
          path: getPortalPath('/agency/clients'),
          keywords: ['customers', 'agency'],
        },
        {
          icon: CreditCard,
          label: t('portal.commandPalette.items.salesRevenue'),
          path: getPortalPath('/agency/sales'),
          keywords: ['analytics', 'money', 'finance'],
        }
      );
    } else {
      navItems.splice(
        1,
        0,
        {
          icon: ClipboardList,
          label: t('portal.sidebar.nav.requests'),
          path: getPortalPath('/requests'),
          keywords: ['my requests', 'list', 'orders', 'tasks'],
        },
        {
          icon: Calendar,
          label: t('portal.sidebar.nav.consultations'),
          path: getPortalPath('/consultations'),
          keywords: ['meetings', 'calls', 'schedule', 'book', 'support'],
        }
      );
    }

    return [
      { heading: t('portal.commandPalette.headings.actions'), items: actionItems },
      {
        heading: t('portal.commandPalette.headings.requests'),
        items: requests.map(req => ({
          icon: FileText,
          label: req.title,
          path: getPortalPath(`/requests/${req.id}`),
          keywords: [req.id, req.status, ...(req.description ? [req.description] : [])],
        })),
      },
      { heading: t('portal.commandPalette.headings.navigation'), items: navItems },
    ];
  }, [orgId, t, requests, isAgency]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    return commands
      .map(group => ({
        ...group,
        items: group.items.filter(
          item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [commands, query]);

  // Flatten for keyboard nav
  const flatItems = useMemo(() => filteredCommands.flatMap(g => g.items), [filteredCommands]);

  const navigateTo = (path: string) => {
    handleOpenChange(false);
    router.push(path);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[activeIndex]) {
          navigateTo(flatItems[activeIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, flatItems]);

  // Reset index when query changes
  useEffect(() => setActiveIndex(0), [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => handleOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-surface-100 dark:border-surface-800 px-4 py-3">
              <Search className="w-5 h-5 text-surface-400 me-3" />
              <input
                autoFocus
                type="text"
                placeholder={t('portal.commandPalette.placeholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder:text-surface-400 text-lg"
              />
              <button
                onClick={() => handleOpenChange(false)}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-1"
              >
                <div className="text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded font-medium border border-surface-200 dark:border-surface-700">
                  ESC
                </div>
              </button>
            </div>

            <div className="overflow-y-auto py-2 flex-1 scrollbar-hide">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-surface-500">
                  <p>{t('portal.commandPalette.noResults')}</p>
                </div>
              ) : (
                filteredCommands.map((group, groupIndex) => {
                  // Calculate offset for flattening index
                  let itemOffset = 0;
                  for (let i = 0; i < groupIndex; i++) {
                    itemOffset += filteredCommands[i].items.length;
                  }

                  return (
                    <div key={group.heading} className="mb-2 last:mb-0">
                      <div className="px-4 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                        {group.heading}
                      </div>
                      {group.items.map((item, itemIndex) => {
                        const globalIndex = itemOffset + itemIndex;
                        return (
                          <CommandItem
                            key={item.label}
                            {...item}
                            active={globalIndex === activeIndex}
                            onSelect={() => navigateTo(item.path)}
                          />
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-surface-100 dark:border-surface-800 px-4 py-2 bg-surface-50 dark:bg-surface-900/50 flex justify-between items-center text-xs text-surface-400">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="bg-surface-200 dark:bg-surface-800 px-1 rounded">↑</span>
                  <span className="bg-surface-200 dark:bg-surface-800 px-1 rounded">↓</span>
                  {t('portal.commandPalette.footer.toNavigate')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="bg-surface-200 dark:bg-surface-800 px-1 rounded">↵</span>
                  {t('portal.commandPalette.footer.toSelect')}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <span className="bg-surface-200 dark:bg-surface-800 px-1 rounded">Esc</span>
                {t('portal.commandPalette.footer.toClose')}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
