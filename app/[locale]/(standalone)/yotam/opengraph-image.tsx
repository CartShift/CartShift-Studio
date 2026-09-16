import { ImageResponse } from 'next/og';

export const alt = 'Yotam Faraggi · Senior Product Engineer · Berlin';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
  const { locale } = await params;
  const isHebrew = locale === 'he';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#171719',
          color: '#ffffff',
          padding: '64px 72px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          direction: isHebrew ? 'rtl' : 'ltr',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.64)',
          }}
        >
          <span>Yotam Faraggi</span>
          <span>Berlin · EU</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              maxWidth: 950,
              fontSize: 82,
              lineHeight: 0.94,
              letterSpacing: '-0.055em',
              fontWeight: 600,
            }}
          >
            {isHebrew ? 'Senior Product Engineer' : 'Senior Product Engineer'}
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: 920,
              fontSize: 30,
              lineHeight: 1.25,
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            {isHebrew
              ? 'Full-Stack · Product · Commerce · Integrations'
              : 'Full-Stack · Product · Commerce · Integrations'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: 26,
            fontSize: 22,
            color: 'rgba(255,255,255,0.64)',
          }}
        >
          <span>{isHebrew ? '10+ שנות תוכנה בפרודקשן' : '10+ years in production software'}</span>
          <span style={{ color: '#9188ff' }}>cart-shift.com/{locale}/yotam</span>
        </div>
      </div>
    ),
    size
  );
}
