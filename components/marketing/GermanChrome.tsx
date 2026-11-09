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
          <nav aria-label="Hauptnavigation" className="hidden flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold md:flex">
            {links.map(({href,label}) => (
              <Link key={href} href={href} className="transition-colors hover:text-primary-600 dark:hover:text-primary-300">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <details className="group relative md:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border border-surface-300 px-4 text-sm font-bold transition-colors hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:border-white/20 dark:hover:bg-surface-800 [&::-webkit-details-marker]:hidden">
                Menü
                <span aria-hidden="true" className="ms-2 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <nav aria-label="Mobile Hauptnavigation" className="absolute end-0 top-full z-50 mt-3 flex min-w-52 flex-col gap-1 rounded-2xl border border-surface-200 bg-white p-2 shadow-2xl dark:border-white/15 dark:bg-surface-900">
                {links.map(({href,label}) => (
                  <Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:hover:bg-surface-800">{label}</Link>
                ))}
              </nav>
            </details>
          </div>
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
