'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Icon } from '@/components/ui/Icon';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useDirection } from '@/lib/i18n-utils';
import { useNavigationState, DropdownType } from '@/lib/hooks/useNavigationState';

export const Header: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const { user } = usePortalAuth();
  const isLoggedIn = !!user;

  // Unified navigation state - Issue #1 fix
  const { state, actions, refs } = useNavigationState();

  const navigation = useMemo(
    () => [
      { name: t('nav.home'), href: '/' },
      {
        name: t('nav.services'),
        href: '#',
        dropdownType: 'solutions' as DropdownType,
        submenu: [
          { name: t('servicesOverview.shopify.title'), href: '/solutions/shopify' },
          { name: t('servicesOverview.wordpress.title'), href: '/solutions/wordpress' },
          { name: t('nav.maintenance'), href: '/maintenance' },
        ],
      },
      {
        name: t('nav.company'),
        href: '#',
        dropdownType: 'company' as DropdownType,
        submenu: [
          { name: t('nav.work'), href: '/work' },
          { name: t('nav.pricing'), href: '/pricing' },
          { name: t('nav.about'), href: '/about' },
        ],
      },
      {
        name: t('nav.tools') || 'Tools',
        href: '#',
        dropdownType: 'tools' as DropdownType,
        submenu: [
          {
            name: t('analyzer.hero.title') || 'Free Store Analyzer',
            href: '/tools/store-analyzer',
          },
          { name: t('nav.clientPortal') || 'Client Portal', href: '/tools/client-portal' },
        ],
      },
      { name: t('nav.blog'), href: '/blog' },
      { name: t('nav.contact'), href: '/contact' },
    ],
    [t]
  );

  // Helper to get the correct ref based on dropdown type
  const getDropdownRefs = (type: DropdownType) => {
    switch (type) {
      case 'solutions':
        return { container: refs.solutionsRef, button: refs.solutionsButtonRef };
      case 'company':
        return { container: refs.companyRef, button: refs.companyButtonRef };
      case 'tools':
        return { container: refs.toolsRef, button: refs.toolsButtonRef };
      default:
        return { container: refs.solutionsRef, button: refs.solutionsButtonRef };
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: state.isHeaderVisible ? 0 : -100,
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          'fixed top-0 start-0 end-0 z-modal transition-all duration-500',
          state.isAtTop
            ? 'bg-transparent border-transparent'
            : 'bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-white/5 shadow-premium'
        )}
      >
        {/* Top highlight line when scrolled */}
        {!state.isAtTop && (
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />
        )}

        <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12" aria-label="Top">
          <div className="flex items-center justify-between h-20 md:h-24">
            <div className="flex items-center gap-12">
              <Logo size="md" className="hover:scale-105 transition-transform duration-300" />

              <div className="hidden lg:flex items-center gap-8">
                {navigation.map(item => {
                  if (item.submenu && item.dropdownType) {
                    const isOpen = state.activeDropdown === item.dropdownType;
                    const dropdownRefs = getDropdownRefs(item.dropdownType);

                    return (
                      <div
                        key={item.name}
                        className="relative group/nav"
                        onMouseEnter={() => actions.openDropdown(item.dropdownType!)}
                        onMouseLeave={() => actions.closeDropdown()}
                        ref={dropdownRefs.container}
                      >
                        <button
                          ref={dropdownRefs.button}
                          className={cn(
                            'flex items-center gap-1.5 py-2 text-sm font-semibold tracking-tight transition-colors duration-200 focus:outline-none',
                            isOpen
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                          )}
                          aria-expanded={isOpen}
                          aria-haspopup="true"
                          onClick={() => actions.toggleDropdown(item.dropdownType!)}
                        >
                          {item.name}
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            className="opacity-50 group-hover/nav:opacity-100"
                          >
                            <Icon name="chevron-down" size={14} />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="absolute top-full start-0 mt-3 w-64 z-[60] p-1.5 rounded-2xl bg-white dark:bg-surface-900 backdrop-blur-xl border border-surface-200 dark:border-surface-700/60 shadow-xl shadow-surface-900/10 dark:shadow-black/30 overflow-hidden"
                              role="menu"
                            >
                              {/* Accent gradient line */}
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary-500 to-accent-500 opacity-60" />
                              <div className="grid gap-0.5 pt-1">
                                {item.submenu.map(subItem => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-white transition-colors duration-150"
                                    role="menuitem"
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
                      className="relative py-2 text-sm font-semibold tracking-tight text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-200 group/link"
                    >
                      {item.name}
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-start" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Controls wrapper - Language & Theme */}
              <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-surface-100/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 backdrop-blur-sm">
                <LanguageSwitcher />
                <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
                <ThemeToggle />
              </div>

              {/* CTA Button */}
              {!isLoggedIn && (
                <Link href={getPortalPath('/login/')}>
                  <Button
                    as="div"
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium me-2"
                  >
                    {t('nav.login')}
                  </Button>
                </Link>
              )}

              <Link href={isLoggedIn ? getPortalPath('/') : '/tools/store-analyzer'}>
                <Button
                  as="div"
                  size="md"
                  className="font-outfit font-black tracking-tight shadow-lg shadow-primary-500/15 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.97] px-5 sm:px-6 transition-shadow"
                >
                  {isLoggedIn ? (
                    <span className="flex items-center gap-2">
                      <Icon name="layout" size={16} />
                      <span className="hidden xs:inline">{t('nav.portal')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Icon name="bar-chart" size={16} />
                      <span>{t('nav.freeAudit')}</span>
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden w-11 h-11 flex items-center justify-center text-surface-600 dark:text-surface-400 bg-surface-100/80 dark:bg-surface-800/60 hover:bg-surface-200/80 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white focus:outline-none rounded-xl border border-surface-200/60 dark:border-surface-700/40 transition-all active:scale-95"
                onClick={actions.toggleMobileMenu}
                aria-label="Toggle menu"
                aria-expanded={state.isMobileMenuOpen}
              >
                <Icon name={state.isMobileMenuOpen ? 'x' : 'menu'} size={22} />
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer - must be outside header to avoid being hidden on scroll */}
      <AnimatePresence>
        {state.isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-[100] lg:hidden"
              onClick={actions.closeMobileMenu}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: isRtl ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 end-0 bottom-0 w-[85vw] max-w-sm z-[101] bg-white dark:bg-surface-950 backdrop-blur-2xl border-s border-surface-200 dark:border-surface-800 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-20 px-6 border-b border-surface-200 dark:border-surface-800">
                <Logo size="sm" />
                <button
                  onClick={actions.closeMobileMenu}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 transition-colors"
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
                      const isExpanded = state.activeMobileDropdown === item.dropdownType;

                      return (
                        <div key={item.name} className="space-y-1">
                          <button
                            onClick={() => actions.toggleMobileDropdown(item.dropdownType!)}
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
                                      className="block py-2.5 px-3 -mx-3 rounded-lg text-surface-600 dark:text-surface-400 font-semibold hover:bg-surface-100 dark:hover:bg-surface-800/40 hover:text-surface-900 dark:hover:text-white transition-colors"
                                      onClick={actions.closeMobileMenu}
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
                        onClick={actions.closeMobileMenu}
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
                  <Link
                    href={getPortalPath(isLoggedIn ? '/' : '/login/')}
                    onClick={actions.closeMobileMenu}
                  >
                    <Button as="div" variant="primary" className="w-full h-12 text-base font-bold">
                      <span className="flex items-center justify-center gap-2">
                        <Icon name={isLoggedIn ? 'layout' : 'log-in'} size={18} />
                        {isLoggedIn ? t('nav.portal') : t('nav.login')}
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
