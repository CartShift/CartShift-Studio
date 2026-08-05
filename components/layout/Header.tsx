'use client';

import React, { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { DropdownMenu } from 'radix-ui';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Icon } from '@/components/ui/Icon';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useDirection } from '@/lib/i18n-utils';
import { useNavigationState, DropdownType } from '@/lib/hooks/useNavigationState';
import { useSystemSettings } from '@/lib/hooks/useSystemSettings';

import { MobileMenu } from './MobileMenu';

export const Header: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const { user } = usePortalAuth();
  const isLoggedIn = !!user;
  const pathname = usePathname();
  const { settings: systemSettings } = useSystemSettings();
  const isPricingVisible = systemSettings.isPricingPageVisible;
  const isMaintenanceVisible = systemSettings.isMaintenancePageVisible;

  // Unified navigation state - Issue #1 fix
  const { state, actions, refs } = useNavigationState();
  const router = useRouter();
  const isWorkItemPage = /^\/work\/[^/]+\/?$/.test(pathname);
  const useSolidHeader = !state.isAtTop || isWorkItemPage;

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
          { name: t('servicesOverview.seo.title'), href: '/solutions/seo' },
          ...(isMaintenanceVisible ? [{ name: t('nav.maintenance'), href: '/maintenance' }] : []),
        ],
      },
      {
        name: t('nav.company'),
        href: '#',
        dropdownType: 'company' as DropdownType,
        submenu: [
          { name: t('nav.work'), href: '/work' },
          ...(isPricingVisible ? [{ name: t('nav.pricing'), href: '/pricing' }] : []),
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
    [t, isPricingVisible, isMaintenanceVisible]
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
          useSolidHeader
            ? 'bg-white/88 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/70 dark:border-white/5 shadow-premium'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Top highlight line when scrolled */}
        {useSolidHeader && (
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
                      <DropdownMenu.Root
                        key={item.name}
                        open={isOpen}
                        onOpenChange={open =>
                          open ? actions.openDropdown(item.dropdownType!) : actions.closeDropdown()
                        }
                      >
                        <DropdownMenu.Trigger asChild>
                          <button
                            ref={dropdownRefs.button}
                            className={cn(
                              'flex items-center gap-1.5 py-2 text-sm font-semibold tracking-tight transition-colors duration-200 focus:outline-none',
                              isOpen
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-surface-600 dark:text-white hover:text-surface-900 dark:hover:text-white'
                            )}
                          >
                            {item.name}
                            <motion.span
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              className="opacity-50 group-hover/nav:opacity-100"
                            >
                              <Icon name="chevron-down" size={14} />
                            </motion.span>
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="start"
                            sideOffset={12}
                            collisionPadding={12}
                            className="z-[60] w-64 overflow-hidden rounded-2xl border border-surface-200 bg-white p-1.5 shadow-xl shadow-surface-900/10 outline-none backdrop-blur-xl dark:border-surface-700/60 dark:bg-surface-900 dark:shadow-black/30 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none"
                          >
                            {/* Accent gradient line */}
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary-500 to-accent-500 opacity-60" />
                            <div className="grid gap-0.5 pt-1">
                              {item.submenu.map(subItem => (
                                <DropdownMenu.Item key={subItem.name} asChild>
                                  <Link
                                    href={subItem.href}
                                    className="flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-surface-700 outline-none transition-colors duration-150 hover:bg-surface-100 hover:text-surface-900 data-[highlighted]:bg-surface-100 dark:text-white dark:hover:bg-surface-800/60 dark:hover:text-white dark:data-[highlighted]:bg-surface-800/60"
                                  >
                                    {subItem.name}
                                  </Link>
                                </DropdownMenu.Item>
                              ))}
                            </div>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="relative py-2 text-sm font-semibold tracking-tight text-surface-600 dark:text-white hover:text-surface-900 dark:hover:text-white transition-colors duration-200 group/link"
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex text-surface-600 dark:text-white hover:text-primary-600 dark:hover:text-white font-medium me-2"
                  onClick={() => router.push(getPortalPath('/login/'))}
                >
                  {t('nav.login')}
                </Button>
              )}

              <Button
                size="md"
                className="font-outfit font-black tracking-tight shadow-lg shadow-primary-500/15 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.97] px-5 sm:px-6 transition-shadow"
                onClick={() =>
                  router.push(isLoggedIn ? getPortalPath('/') : '/tools/store-analyzer')
                }
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

              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden w-11 h-11 flex items-center justify-center text-surface-600 dark:text-white bg-surface-100/80 dark:bg-surface-800/60 hover:bg-surface-200/80 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white focus:outline-none rounded-xl border border-surface-200/60 dark:border-surface-700/40 transition-all active:scale-95"
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
      <MobileMenu
        isOpen={state.isMobileMenuOpen}
        onClose={actions.closeMobileMenu}
        navigation={navigation}
        activeDropdown={state.activeMobileDropdown}
        onToggleDropdown={actions.toggleMobileDropdown}
        isRtl={isRtl}
        isLoggedIn={isLoggedIn}
        t={t}
      />
    </>
  );
};
