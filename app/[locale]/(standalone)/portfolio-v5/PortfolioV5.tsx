'use client';

import { useState } from 'react';
import V5Navigation from './V5Navigation';
import FluidField from './FluidField';
import { translations } from './v5-copy';

type Props = { locale: 'en' | 'he'; email: string };

export default function PortfolioV5({ locale }: Props) {
  const t = translations[locale];
  const [paused, setPaused] = useState(false);
  const home = '/' + locale + '/portfolio-v5';
  const he = locale === 'he';

  return (
    <main className={'v5-page v5-immersive-home' + (paused ? ' v5-motion-paused' : '')} dir={he ? 'rtl' : 'ltr'}>
      <a className="v5-skip-link" href="#v5-immersive-title">{he ? 'דלג לתוכן' : 'Skip to content'}</a>
      <V5Navigation locale={locale} motionPaused={paused} onToggleMotion={() => setPaused(s => !s)} />
      <section className="v5-immersive-hero" aria-labelledby="v5-immersive-title">
        <FluidField paused={paused} />
        <div className="v5-immersive-content">
          <div className="v5-immersive-pretitle">{he ? 'מעצב · מפתח · יוצר' : 'Design-minded developer & digital maker'}</div>
          <h1 id="v5-immersive-title" className="v5-immersive-title">
            <span>{he ? 'היי, אני' : "Hey, I’m"} <strong>{he ? 'יותם פרג׳י' : 'Yotam Faraggi'}</strong></span>
            <span>{he ? 'הופך רעיונות' : 'I turn ideas into'} <strong>{he ? 'למוצרים אמיתיים' : 'real products'}</strong></span>
          </h1>
          <p className="v5-immersive-subtitle">{he
            ? 'מהנדס מוצר, מפתח Full-Stack ויוצר סקרן'
            : 'Product engineer, full-stack developer'}
            <span>{he ? 'מברלין. מרעיון ראשוני למוצר שעובד בעולם.' : '& creative problem solver based in Berlin.'}</span>
          </p>
          <nav className="v5-immersive-links" aria-label={he ? 'קישורים ראשיים' : 'Explore the portfolio'}>
            <a href={home + '/work'}><span aria-hidden="true">↗</span>{t.seeWork}</a>
            <a href={home + '/about'}><span aria-hidden="true">↗</span>{t.seeAbout}</a>
          </nav>
        </div>
        <div className="v5-immersive-footer">
          <span className="v5-immersive-location">{he ? 'ברלין, גרמניה' : 'Berlin, Germany'} <i aria-hidden="true" /></span>
          <span>© {new Date().getFullYear()} · Yotam Faraggi</span>
          <a href={home + '/contact'}>{he ? 'בואו נדבר' : 'Let’s talk'} <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>
  );
}
