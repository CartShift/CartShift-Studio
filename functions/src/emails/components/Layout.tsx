import * as React from 'react';
import { Html, Head, Body, Container, Section, Img, Preview, Font } from '@react-email/components';
import { theme } from '../theme';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  title?: string;
}

export const Layout = ({ children, preview, title = 'CartShift Studio' }: LayoutProps) => {
  return (
    <Html>
      <Head>
        <title>{title}</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src="https://cart-shift.com/assets/logo-email.png" // Ensure this asset exists or use a robust URL
              alt="CartShift Studio"
              width="150"
              style={styles.logo}
            />
          </Section>

          <Section style={styles.content}>{children}</Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: theme.colors.background,
    margin: '0',
    fontFamily: theme.fontFamily.sans,
  },
  container: {
    backgroundColor: theme.colors.surface,
    margin: '40px auto',
    padding: '0',
    borderRadius: theme.borderRadius.lg,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '600px',
    overflow: 'hidden' as const,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: `${theme.spacing.s8} 0`,
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
    display: 'block',
    // Fallback for missing image - maybe use text if image fails
  },
  content: {
    padding: theme.spacing.s10,
  },
};
