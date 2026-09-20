import { ImageResponse } from 'next/og';
import { getPortfolioShowcase } from '@/lib/portfolio-showcase';

export const alt = 'Yotam Faraggi project case study';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
  const { locale, slug } = await params;
  const project = getPortfolioShowcase(slug, locale);
  const isHebrew = locale === 'he';

  const title = project?.title ?? 'Project case study';
  const descriptor = project?.descriptor ?? 'Product engineering';
  const summary = project?.summary ?? '';
  const accent = project?.accent ?? '#7367f0';
  const status = project?.status ?? (isHebrew ? 'פרויקט' : 'Project');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#111113',
          color: '#ffffff',
          padding: '58px 68px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          direction: isHebrew ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,.64)', letterSpacing: '.08em' }}>
            Yotam Faraggi
          </span>
          <span
            style={{
              fontSize: 18,
              color: '#111113',
              background: accent,
              borderRadius: 999,
              padding: '12px 18px',
              fontWeight: 700,
            }}
          >
            {status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040 }}>
          <span style={{ fontSize: 24, color: accent, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {descriptor}
          </span>
          <div
            style={{
              display: 'flex',
              fontSize: 92,
              lineHeight: 0.92,
              letterSpacing: '-.06em',
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: 930,
              fontSize: 28,
              lineHeight: 1.28,
              color: 'rgba(255,255,255,.72)',
            }}
          >
            {summary}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,.18)',
            paddingTop: 22,
            fontSize: 19,
            color: 'rgba(255,255,255,.5)',
          }}
        >
          <span>{project?.year ?? '2026'}</span>
          <span>cart-shift.com/{locale}/portfolio/{slug}</span>
        </div>
      </div>
    ),
    size
  );
}
