'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackNewsletterSignup } from '@/lib/analytics';
import { subscribeNewsletterClient } from '@/lib/services/newsletter-client';

export const Footer: React.FC = () => {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2026);

  const footerLinks = {
    solutions: [
      { name: t('footer.links.shopify'), href: '/solutions/shopify' },
      { name: t('footer.links.wordpress'), href: '/solutions/wordpress' },
      { name: t('nav.pricing'), href: '/pricing' },
      { name: t('nav.maintenance'), href: '/maintenance' },
    ],
    tools: [
      { name: t('analyzer.hero.title') || 'Store Analyzer', href: '/tools/store-analyzer' },
      { name: t('nav.clientPortal') || 'Client Portal', href: '/tools/client-portal' },
    ],
    company: [
      { name: t('footer.links.about'), href: '/about' },
      { name: t('nav.work'), href: '/work' },
      { name: t('footer.links.blog'), href: '/blog' },
      { name: t('footer.links.contact'), href: '/contact' },
    ],
  };

  const socialLinks = [
    { name: 'LinkedIn', href: 'https://linkedin.com/company/cartshiftstudio', icon: 'linkedin' },
    { name: 'Twitter', href: 'https://twitter.com/cartshiftstudio', icon: 'twitter' },
    { name: 'GitHub', href: 'https://github.com/cartshiftstudio', icon: 'github' },
  ];

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await subscribeNewsletterClient({ email });

      if (!result.success) {
        throw new Error(result.error || t('portal.common.failedToSubscribe'));
      }

      setSubscribed(true);
      setEmail('');
      trackNewsletterSignup('footer');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portal.common.failedToSubscribe'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative border-t border-surface-300/60 dark:border-white/10 bg-white dark:bg-surface-950">
      <div className="absolute inset-0 bg-gradient-to-t from-surface-200/80 dark:from-black/50 via-white/60 dark:via-surface-950/50 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 xl:gap-12">
          <div className="md:col-span-12 lg:col-span-3 xl:col-span-3 text-start">
            <Logo size="lg" className="mb-6" />
            <p className="text-surface-600 dark:text-surface-400 max-w-md mb-6 text-sm md:text-base leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(social => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-surface-200/70 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-accent-100 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 transition-all border border-surface-300/40 dark:border-transparent"
                  aria-label={social.name}
                >
                  <Icon name={social.icon} size={20} />
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 lg:col-span-2 xl:col-span-2 text-start">
            <h3 className="text-surface-900 dark:text-white font-bold mb-6 text-base md:text-lg leading-tight">
              {t('footer.solutions')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors font-medium text-sm md:text-base"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-2 xl:col-span-2 text-start">
            <h3 className="text-surface-900 dark:text-white font-bold mb-6 text-base md:text-lg leading-tight">
              {t('nav.tools') || 'Free Tools'}
            </h3>
            <ul className="space-y-3">
              {footerLinks.tools.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors font-medium text-sm md:text-base"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-2 xl:col-span-2 text-start">
            <h3 className="text-surface-900 dark:text-white font-bold mb-6 text-base md:text-lg leading-tight">
              {t('footer.company')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors font-medium text-sm md:text-base"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-12 lg:col-span-3 xl:col-span-3 text-start">
            <h3 className="text-surface-900 dark:text-white font-bold mb-6 text-base md:text-lg leading-tight">
              {t('footer.newsletter.title')}
            </h3>
            {subscribed ? (
              <div className="flex items-center gap-2 text-success">
                <Icon name="check" size={20} />
                <span className="text-sm font-medium">{t('footer.newsletter.success')}</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-3 max-w-md lg:max-w-none">
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-4">
                  {t('footer.newsletter.description')}
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder={t('footer.newsletter.placeholder')}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 border border-surface-300/60 dark:border-surface-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-sm shadow-sm"
                    style={{ direction: 'ltr' }}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    className="!px-2 !py-2"
                    loading={loading}
                    disabled={loading}
                    aria-label={t('footer.newsletter.subscribe')}
                  >
                    <Icon name="mail" size={20} aria-hidden="true" />
                    <span className="sr-only">{t('footer.newsletter.subscribe')}</span>
                  </Button>
                </div>
                {error && <p className="text-error text-sm">{error}</p>}
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-300/60 dark:border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p className="text-xs md:text-sm text-surface-500 dark:text-surface-500 leading-relaxed text-center md:text-start">
                © {currentYear} CartShift Studio. {t('footer.rights')}
              </p>
              <div className="flex items-center gap-3 text-xs md:text-sm">
                <Link
                  href="/privacy"
                  className="text-surface-500 dark:text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                >
                  {t('footer.links.privacy')}
                </Link>
                <span className="text-surface-300 dark:text-surface-700">|</span>
                <Link
                  href="/terms"
                  className="text-surface-500 dark:text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                >
                  {t('footer.links.terms')}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs md:text-sm text-surface-500 dark:text-surface-500">
              <span className="flex items-center gap-2">
                <Icon name="shield" size={16} className="text-success" />
                {t('footer.newsletter.sslSecured')}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="award" size={16} className="text-accent-500" />
                {t('footer.newsletter.shopifyPartner')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
