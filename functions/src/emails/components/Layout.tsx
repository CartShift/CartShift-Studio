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
        <Container style={styles.container}>
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
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f3f6fb',
    margin: '0',
    fontFamily: theme.fontFamily.sans,
  },
  container: {
    backgroundColor: theme.colors.surface,
    margin: '32px auto',
    padding: '0',
    borderRadius: '18px',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.10)',
    maxWidth: '600px',
    overflow: 'hidden' as const,
  },
  header: {
    backgroundColor: '#102a43',
    padding: '28px 40px 24px',
    textAlign: 'center' as const,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '5px',
    lineHeight: '1',
    margin: '0',
  },
  studio: {
    color: '#7dd3fc',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '8px',
    lineHeight: '1',
    margin: '8px 0 0',
  },
  headerLine: {
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '16px 0 0',
  },
  content: {
    padding: '38px 40px 34px',
  },
};
