'use client';

import { useEffect, useRef, useState } from 'react';
import { translations, type PortfolioV5Locale } from './v5-copy';

type Section = 'work' | 'about' | 'contact';
type Props = {
  locale: PortfolioV5Locale;
  section?: Section;
  motionPaused?: boolean;
  onToggleMotion?: () => void;
};

export default function V5Navigation({ locale, section, motionPaused = false, onToggleMotion }: Props) {
  const t = translations[locale];
  const isHebrew = locale === 'he';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const homeHref = '/' + locale + '/portfolio-v5';
  const otherLocale = isHebrew ? 'en' : 'he';
  const languageHref = '/' + otherLocale + '/portfolio-v5' + (section ? '/' + section : '');
  const navigation = [
    { label: t.home, href: homeHref, number: '01' },
    { label: t.work, href: homeHref + '/work', number: '02' },
    { label: t.about, href: homeHref + '/about', number: '03' },
    { label: t.contact, href: homeHref + '/contact', number: '04' },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLAnchorElement>('nav a')?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('nav a[href], button:not([disabled])')
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      toggleRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  return (
    <>
      <header className={'v5-header' + (menuOpen ? ' v5-header--open' : '')}>
        <a className="v5-brand" href={homeHref} aria-label={isHebrew ? 'יותם פרג׳י - ראשי' : 'Yotam Faraggi - Home'}>
          <span className="v5-brand-mark" aria-hidden="true">yf<span>✳</span></span>
          <span className="v5-brand-name">YOTAM<br />FARAGGI</span>
        </a>
        <div className="v5-header-controls">
          <a className="v5-language-link" href={languageHref} hrefLang={otherLocale}
            lang={otherLocale} aria-label={t.switchLanguage}>{isHebrew ? 'EN' : 'HE'}</a>
          {onToggleMotion && (
            <button className="v5-motion-button" type="button"
              aria-label={motionPaused ? t.motionOff : t.motionOn} aria-pressed={motionPaused}
              onClick={onToggleMotion} title={motionPaused ? t.motionOff : t.motionOn}>
              <span className={'v5-motion-indicator' + (motionPaused ? ' v5-motion-indicator--off' : '')} aria-hidden="true" />
              <span className="v5-motion-label">Motion</span>
            </button>
          )}
          <button className="v5-menu-toggle" type="button" ref={toggleRef}
            aria-label={menuOpen ? t.close : t.menu} aria-expanded={menuOpen}
            aria-controls="v5-navigation-dialog" onClick={() => setMenuOpen(open => !open)}>
            <span>{menuOpen ? t.close : t.menu}</span>
            <span className={'v5-menu-icon' + (menuOpen ? ' v5-menu-icon--open' : '')} aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>
      {menuOpen && (
        <div id="v5-navigation-dialog" className="v5-menu-panel" ref={menuRef}
          role="dialog" aria-modal="true" aria-label={t.menuNav}>
          <button className="v5-panel-close" type="button"
            onClick={() => setMenuOpen(false)}>{t.close} <span aria-hidden="true">×</span></button>
          <nav aria-label={t.menuNav}>
            {navigation.map(item => (
              <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}
                aria-current={section && item.href.endsWith('/' + section) ? 'page' : undefined}>
                <span className="v5-menu-number">{item.number}</span>
                <span>{item.label}</span>
                <span aria-hidden="true" className="v5-menu-arrow">↗</span>
              </a>
            ))}
          </nav>
          <p>© {new Date().getFullYear()} · Yotam Faraggi</p>
        </div>
      )}
    </>
  );
}
