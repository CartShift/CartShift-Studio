import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Preview, Font } from '@react-email/components';
import { theme } from '../theme';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  title?: string;
  locale?: 'en' | 'he';
}

export const Layout = ({
  children,
  preview,
  title = 'CartShift Studio',
  locale = 'en',
}: LayoutProps) => {
  const isRtl = locale === 'he';

  return (
    <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head>
        <title>{title}</title>
        <Font
          fontFamily="Rubik"
          fallbackFontFamily={['Arial', 'Helvetica', 'sans-serif']}
          webFont={{
            url: 'https://portal.cart-shift.com/fonts/Rubik-Regular.ttf',
            format: 'truetype',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Rubik"
          fallbackFontFamily={['Arial', 'Helvetica', 'sans-serif']}
          webFont={{
            url: 'https://portal.cart-shift.com/fonts/Rubik-Bold.ttf',
            format: 'truetype',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={styles.body}>
        <Section style={styles.outer}>
          <Container style={styles.container}>
            <Section style={styles.topAccent} />
            <Section style={styles.header}>
              <Text style={styles.wordmark}>CARTSHIFT</Text>
              <Text style={styles.studio}>STUDIO</Text>
              <Text style={styles.headerLine}>
                {isRtl ? 'מסחר דיגיטלי. בנוי נכון.' : 'Digital commerce, built with intent.'}
              </Text>
            </Section>

            <Section style={styles.content}>{children}</Section>

            <Footer locale={locale} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

export const EmailHero = ({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) => {
  return (
    <Section style={{ ...styles.hero, textAlign: align }}>
      {eyebrow ? <Text style={styles.heroEyebrow}>{eyebrow}</Text> : null}
      <Text style={{ ...styles.heroTitle, textAlign: align }}>{title}</Text>
      {description ? (
        <Text style={{ ...styles.heroDescription, textAlign: align }}>{description}</Text>
      ) : null}
    </Section>
  );
};

export const SurfaceCard = ({
  children,
  tone = 'default',
  align = 'left',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'dark';
  align?: 'left' | 'center' | 'right';
}) => {
  const toneStyle = cardTones[tone] || cardTones.default;

  return (
    <Section style={{ ...styles.surfaceCard, ...toneStyle, textAlign: align }}>{children}</Section>
  );
};

export const FinePrint = ({
  children,
  align = 'center',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) => {
  return <Text style={{ ...styles.finePrint, textAlign: align }}>{children}</Text>;
};

const cardTones = {
  default: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
  },
  info: {
    backgroundColor: theme.colors.info.soft,
    borderColor: theme.colors.info.border,
  },
  success: {
    backgroundColor: theme.colors.success.soft,
    borderColor: theme.colors.success.border,
  },
  warning: {
    backgroundColor: theme.colors.warning.soft,
    borderColor: theme.colors.warning.border,
  },
  error: {
    backgroundColor: theme.colors.error.soft,
    borderColor: theme.colors.error.border,
  },
  dark: {
    backgroundColor: theme.colors.navyMuted,
    borderColor: '#263a56',
  },
};

const styles = {
  body: {
    backgroundColor: theme.colors.background,
    margin: '0',
    padding: '0',
    fontFamily: theme.fontFamily.sans,
  },
  outer: {
    padding: '32px 12px',
  },
  container: {
    backgroundColor: theme.colors.surface,
    margin: '0 auto',
    padding: '0',
    borderRadius: '22px',
    boxShadow: theme.shadows.card,
    maxWidth: '640px',
    overflow: 'hidden' as const,
    border: `1px solid ${theme.colors.border}`,
  },
  topAccent: {
    backgroundColor: theme.colors.cyan,
    height: '5px',
    lineHeight: '5px',
  },
  header: {
    backgroundColor: theme.colors.navy,
    padding: '34px 40px 30px',
    textAlign: 'center' as const,
  },
  wordmark: {
    color: theme.colors.text.inverse,
    fontSize: '25px',
    fontWeight: '700',
    letterSpacing: '5px',
    lineHeight: '1',
    margin: '0',
  },
  studio: {
    color: theme.colors.cyan,
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '8px',
    lineHeight: '1',
    margin: '8px 0 0',
  },
  headerLine: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.fontSize.sm,
    lineHeight: '1.6',
    margin: '18px 0 0',
  },
  content: {
    padding: '42px 42px 36px',
  },
  hero: {
    margin: '0 0 30px',
  },
  heroEyebrow: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: '1.6px',
    lineHeight: '1.4',
    margin: '0 0 10px',
    textTransform: 'uppercase' as const,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.display,
    fontWeight: '700',
    lineHeight: '1.18',
    letterSpacing: '0',
    margin: '0',
  },
  heroDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.base,
    lineHeight: '1.75',
    margin: '16px 0 0',
  },
  surfaceCard: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.xl,
    margin: '0 0 28px',
    padding: '24px',
    boxShadow: theme.shadows.soft,
  },
  finePrint: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    lineHeight: '1.7',
    margin: '18px 0 0',
  },
};
