'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Icon } from '@/components/ui/Icon';
import { Link, useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { MobileDropdownType } from '@/lib/hooks/useNavigationState';
import { DropdownType } from '@/lib/hooks/useNavigationState';
import { useTranslations } from 'next-intl';

// Define the navigation item structure (reused from Header)
export interface NavigationItem {
  name: string;
  href: string;
  dropdownType?: DropdownType;
  submenu?: { name: string; href: string }[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  activeDropdown: MobileDropdownType;
  onToggleDropdown: (type: MobileDropdownType) => void;
  isRtl: boolean;
  isLoggedIn: boolean;
  t: ReturnType<typeof useTranslations>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navigation,
  activeDropdown,
  onToggleDropdown,
  isRtl,
  isLoggedIn,
  t,
}) => {
  const router = useRouter();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-mobile-menu-backdrop lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: isRtl ? 0.5 : 0.05, right: isRtl ? 0.05 : 0.5 }}
            onDragEnd={(_e, { offset, velocity }) => {
              const swipeThreshold = 50;
              if (isRtl) {
                // In RTL (menu on left), swipe left (negative x) to close
                if (offset.x < -swipeThreshold || velocity.x < -500) onClose();
              } else {
                // In LTR (menu on right), swipe right (positive x) to close
                if (offset.x > swipeThreshold || velocity.x > 500) onClose();
              }
            }}
            className="lg:hidden fixed inset-y-0 end-0 w-[85vw] max-w-sm z-mobile-menu bg-white dark:bg-surface-950 backdrop-blur-2xl border-s border-surface-200 dark:border-surface-800 flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-surface-200 dark:border-surface-800">
              <Logo size="sm" />
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-white transition-colors"
                aria-label="Close menu"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="space-y-1">
                {navigation.map(item => {
                  if (item.submenu && item.dropdownType) {
                    const isExpanded = activeDropdown === item.dropdownType;
                    // We need to cast item.dropdownType to MobileDropdownType because Header treats them slightly differently in types
                    // but in practice they are compatible strings.
                    const mobileType = item.dropdownType as MobileDropdownType;

                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          onClick={() => onToggleDropdown(mobileType)}
                          className="w-full flex items-center justify-between py-3 px-3 -mx-3 rounded-xl text-base font-bold tracking-tight text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800/60 transition-colors"
                        >
                          <span>{item.name}</span>
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon name="chevron-down" size={18} className="text-surface-400" />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ps-4 pb-2 space-y-1">
                                {item.submenu.map(subItem => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className="block py-2.5 px-3 -mx-3 rounded-lg text-surface-600 dark:text-white font-semibold hover:bg-surface-100 dark:hover:bg-surface-800/40 hover:text-surface-900 dark:hover:text-white transition-colors"
                                    onClick={onClose}
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block py-3 px-3 -mx-3 rounded-xl text-base font-bold tracking-tight text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800/60 transition-colors"
                      onClick={onClose}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Footer Controls */}
              <div className="pt-6 border-t border-surface-200 dark:border-surface-800 space-y-5">
                {/* Language & Theme Controls Container */}
                <div className="flex items-center gap-3 p-2 bg-surface-100 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700/50">
                  <LanguageSwitcher />
                  <div className="w-px h-6 bg-surface-300 dark:bg-surface-600" />
                  <ThemeToggle />
                </div>

                {/* CTA Button */}
                <Button
                  variant="primary"
                  className="w-full h-12 text-base font-bold"
                  onClick={() => {
                    onClose();
                    router.push(getPortalPath(isLoggedIn ? '/' : '/login/'));
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon name={isLoggedIn ? 'layout' : 'log-in'} size={18} />
                    {isLoggedIn ? t('nav.portal') : t('nav.login')}
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
