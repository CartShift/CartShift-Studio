'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>('.v5-panel-close')?.focus({ preventScroll: true });
    } else if (!menuOpen && dialog.open) {
      dialog.close();
      toggleRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  return (
    <>
      <header className="v5-header">
        <Link className="v5-brand" href={homeHref} prefetch={false}
          aria-label={isHebrew ? 'יותם פרג׳י - ראשי' : 'Yotam Faraggi - Home'}
          aria-current={section ? undefined : 'page'}>
          <span className="v5-brand-mark" aria-hidden="true">yf<span>✳</span></span>
          <span className="v5-brand-name">YOTAM<br />FARAGGI</span>
        </Link>
        <div className="v5-header-controls">
          <Link className="v5-language-link" href={languageHref} prefetch={false}
            hrefLang={otherLocale} lang={otherLocale} aria-label={t.switchLanguage}>
            {isHebrew ? 'EN' : 'HE'}
          </Link>
          {onToggleMotion && (
            <button className="v5-motion-button" type="button"
              aria-label={motionPaused ? t.motionOff : t.motionOn} aria-pressed={motionPaused}
              onClick={onToggleMotion} title={motionPaused ? t.motionOff : t.motionOn}>
              <span className={'v5-motion-indicator' + (motionPaused ? ' v5-motion-indicator--off' : '')}
                aria-hidden="true" />
              <span className="v5-motion-label">{isHebrew ? 'תנועה' : 'Motion'}</span>
            </button>
          )}
          <button className="v5-menu-toggle" type="button" ref={toggleRef}
            aria-label={menuOpen ? t.close : t.menu} aria-expanded={menuOpen}
            aria-haspopup="dialog" aria-controls="v5-navigation-dialog"
            onClick={() => setMenuOpen(open => !open)}>
            <span>{menuOpen ? t.close : t.menu}</span>
            <span className={'v5-menu-icon' + (menuOpen ? ' v5-menu-icon--open' : '')}
              aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>

      <dialog id="v5-navigation-dialog" className="v5-menu-panel" ref={dialogRef}
        aria-label={t.menuNav}
        onClose={() => setMenuOpen(false)}
        onCancel={() => setMenuOpen(false)}>
        <button className="v5-panel-close" type="button"
          onClick={() => setMenuOpen(false)}>{t.close} <span aria-hidden="true">×</span>
        </button>
        <nav aria-label={t.menuNav}>
          {navigation.map(item => (
            <Link key={item.href} href={item.href} prefetch={false}
              onClick={() => setMenuOpen(false)}
              aria-current={section
                ? (item.href.endsWith('/' + section) ? 'page' : undefined)
                : (item.href === homeHref ? 'page' : undefined)}>
              <span className="v5-menu-number">{item.number}</span>
              <span>{item.label}</span>
              <span aria-hidden="true" className="v5-menu-arrow">↗</span>
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} · Yotam Faraggi</p>
      </dialog>
    </>
  );
}
