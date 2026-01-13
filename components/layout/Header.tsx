'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from '@/lib/motion';
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

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const t = useTranslations();
  const { user } = usePortalAuth();
  const isLoggedIn = !!user;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const companyButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  // Smart scroll behavior using framer-motion's useScroll
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', latest => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    // Update at-top state
    setIsAtTop(latest < 10);

    // Close mobile menu on scroll down
    if (latest > 50 && diff > 5 && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }

    // Smart hide/show
    if (latest > 100) {
      if (diff > 10) setIsVisible(false);
      else if (diff < -10) setIsVisible(true);
    } else {
      setIsVisible(true);
    }
  });

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node) &&
        companyButtonRef.current &&
        !companyButtonRef.current.contains(event.target as Node)
      ) {
        setCompanyOpen(false);
      }
      if (
        toolsDropdownRef.current &&
        !toolsDropdownRef.current.contains(event.target as Node) &&
        toolsButtonRef.current &&
        !toolsButtonRef.current.contains(event.target as Node)
      ) {
        setToolsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSolutionsOpen(false);
        setCompanyOpen(false);
        setToolsOpen(false);
      }
    };

    if (solutionsOpen || companyOpen || toolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [solutionsOpen, companyOpen, toolsOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileSolutionsOpen(false);
      setMobileCompanyOpen(false);
      setMobileToolsOpen(false);
    }
  }, [mobileMenuOpen]);

  const navigation = useMemo(
    () => [
      { name: t('nav.home'), href: '/' },
      {
        name: t('nav.services'),
        href: '#',
        submenu: [
          { name: t('servicesOverview.shopify.title'), href: '/solutions/shopify' },
          { name: t('servicesOverview.wordpress.title'), href: '/solutions/wordpress' },
          { name: t('nav.maintenance'), href: '/maintenance' },
        ],
      },
      {
        name: t('nav.company'),
        href: '#',
        submenu: [
          { name: t('nav.work'), href: '/work' },
          { name: t('nav.pricing'), href: '/pricing' },
          { name: t('nav.about'), href: '/about' },
        ],
      },
      {
        name: t('nav.tools') || 'Tools',
        href: '#',
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

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
      }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'fixed top-0 start-0 end-0 z-50 transition-all duration-500',
        isAtTop
          ? 'bg-transparent border-transparent'
          : 'bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-white/5 shadow-premium'
      )}
    >
      {/* Top highlight line when scrolled */}
      {!isAtTop && (
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />
      )}

      <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12" aria-label="Top">
        <div className="flex items-center justify-between h-20 md:h-24">
          <div className="flex items-center gap-12">
            <Logo size="md" className="hover:scale-105 transition-transform duration-300" />

            <div className="hidden lg:flex items-center gap-8">
              {navigation.map(item => {
                if (item.submenu) {
                  // Determine which dropdown this is
                  const isCompany = item.name === t('nav.company');
                  const isTools = item.name === (t('nav.tools') || 'Tools');

                  // Get the appropriate state and refs based on menu type
                  const isOpen = isCompany ? companyOpen : isTools ? toolsOpen : solutionsOpen;
                  const setIsOpen = isCompany
                    ? setCompanyOpen
                    : isTools
                      ? setToolsOpen
                      : setSolutionsOpen;
                  const ref = isCompany
                    ? companyDropdownRef
                    : isTools
                      ? toolsDropdownRef
                      : dropdownRef;
                  const buttonRefToUse = isCompany
                    ? companyButtonRef
                    : isTools
                      ? toolsButtonRef
                      : buttonRef;

                  return (
                    <div
                      key={item.name}
                      className="relative group/nav"
                      onMouseEnter={() => setIsOpen(true)}
                      onMouseLeave={() => setIsOpen(false)}
                      ref={ref}
                    >
                      <button
                        ref={buttonRefToUse}
                        className={cn(
                          'flex items-center gap-1.5 py-2 text-sm font-semibold tracking-tight transition-colors duration-200 focus:outline-none',
                          isOpen
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={() => setIsOpen(!isOpen)}
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
            <Link href={getPortalPath(isLoggedIn ? '/' : '/login/')}>
              <Button
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
                    <Icon name="log-in" size={16} />
                    <span>{t('nav.login')}</span>
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden w-11 h-11 flex items-center justify-center text-surface-600 dark:text-surface-400 bg-surface-100/80 dark:bg-surface-800/60 hover:bg-surface-200/80 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white focus:outline-none rounded-xl border border-surface-200/60 dark:border-surface-700/40 transition-all active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 end-0 bottom-0 w-[85vw] max-w-sm z-50 bg-white dark:bg-surface-950 backdrop-blur-2xl border-s border-surface-200 dark:border-surface-800 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-20 px-6 border-b border-surface-200 dark:border-surface-800">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
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
                    if (item.submenu) {
                      // Determine which dropdown this is
                      const isCompany = item.name === t('nav.company');
                      const isTools = item.name === (t('nav.tools') || 'Tools');

                      // Get the appropriate state based on menu type
                      const isExpanded = isCompany
                        ? mobileCompanyOpen
                        : isTools
                          ? mobileToolsOpen
                          : mobileSolutionsOpen;
                      const setIsExpanded = isCompany
                        ? setMobileCompanyOpen
                        : isTools
                          ? setMobileToolsOpen
                          : setMobileSolutionsOpen;

                      return (
                        <div key={item.name} className="space-y-1">
                          <button
                            onClick={() => setIsExpanded(!isExpanded)}
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
                                      onClick={() => setMobileMenuOpen(false)}
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
                        onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" className="w-full h-12 text-base font-bold">
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
    </motion.header>
  );
};
