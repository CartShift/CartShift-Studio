import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { CookieConsent } from '@/components/ui/CookieConsent';

const links = [
  { href: '/', label: 'Startseite' },
  { href: '/solutions/shopify', label: 'Shopify' },
  { href: '/solutions/wordpress', label: 'WordPress' },
  { href: '/solutions/seo', label: 'SEO' },
  { href: '/work', label: 'Projekte' },
  { href: '/about', label: 'Über uns' },
  { href: '/contact', label: 'Kontakt' },
] as const;

/** Marketing-only chrome: no partially translated portal widgets or exit-intent overlays. */
export function GermanChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-surface-900 dark:bg-surface-950 dark:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">
        Zum Hauptinhalt
      </a>
      <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-surface-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Logo size="sm" />
          <nav aria-label="Hauptnavigation" className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold md:order-none md:w-auto">
            {links.map(({href,label}) => (
              <Link key={href} href={href} className="transition-colors hover:text-primary-600 dark:hover:text-primary-300">{label}</Link>
            ))}
          </nav>
          <LanguageSwitcher compact />
        </div>
      </header>
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="border-t border-surface-200 bg-surface-50 px-5 py-12 text-sm dark:border-white/10 dark:bg-surface-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm space-y-3">
            <strong className="text-lg">CartShift Studio</strong>
            <p className="text-surface-600 dark:text-surface-300">Individuelle Websites und Onlineshops mit Shopify und WordPress. Für Unternehmen in Deutschland und darüber hinaus.</p>
            <a className="underline underline-offset-4" href="mailto:hello@cart-shift.com">hello@cart-shift.com</a>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/contact">Kontakt</Link>
            <Link href="/privacy" locale="en" hrefLang="en">Datenschutz (EN)</Link>
            <Link href="/terms" locale="en" hrefLang="en">Nutzungsbedingungen (EN)</Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl text-xs text-surface-500">© {new Date().getUTCFullYear()} CartShift Studio</p>
      </footer>
      <CookieConsent />
    </div>
  );
}
