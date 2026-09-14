type StandaloneLocaleSwitchProps = {
  locale: string;
  path: '/cv' | '/portfolio' | '/yotam';
};

export function StandaloneLocaleSwitch({ locale, path }: StandaloneLocaleSwitchProps) {
  const isHebrew = locale === 'he';
  const targetLocale = isHebrew ? 'en' : 'he';
  const label = isHebrew ? 'EN' : 'HE';
  const ariaLabel = isHebrew ? 'Switch to English' : 'מעבר לעברית';

  return (
    <a
      href={`/${targetLocale}${path}`}
      hrefLang={targetLocale}
      lang={targetLocale}
      aria-label={ariaLabel}
      className="fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-full border border-white/25 bg-black/25 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-7"
    >
      {label}
    </a>
  );
}
