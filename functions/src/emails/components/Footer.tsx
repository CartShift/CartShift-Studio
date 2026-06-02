import { Section, Text, Link, Hr } from '@react-email/components';
import { theme } from '../theme';

interface FooterProps {
  locale?: 'en' | 'he';
}

export const Footer = ({ locale = 'en' }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const isRtl = locale === 'he';

  return (
    <Section style={styles.footer}>
      <Hr style={styles.divider} />
      <Text style={styles.text}>
        &copy; {currentYear} CartShift Studio.{' '}
        {isRtl ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
      </Text>
      <Text style={styles.subText}>
        {isRtl ? 'פיתוח, עיצוב וצמיחה למסחר דיגיטלי' : 'E-commerce development, design and growth'}
      </Text>
      <Text style={styles.utilityLinks}>
        <Link href="https://cart-shift.com" style={styles.link}>
          {isRtl ? 'אתר' : 'Website'}
        </Link>{' '}
        •{' '}
        <Link href="https://portal.cart-shift.com" style={styles.link}>
          {isRtl ? 'פורטל לקוחות' : 'Client portal'}
        </Link>{' '}
        •{' '}
        <Link href="mailto:hello@cart-shift.com" style={styles.link}>
          {isRtl ? 'יצירת קשר' : 'Contact'}
        </Link>
      </Text>
    </Section>
  );
};

const styles = {
  footer: {
    padding: `${theme.spacing.s6} ${theme.spacing.s10}`,
    backgroundColor: '#f8fafc',
    textAlign: 'center' as const,
  },
  divider: {
    borderColor: '#e2e8f0',
    margin: `0 0 ${theme.spacing.s6} 0`,
  },
  text: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    margin: '0 0 4px',
    lineHeight: '1.5',
  },
  subText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    margin: '0 0 16px',
    fontStyle: 'italic' as const,
  },
  utilityLinks: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
  },
  link: {
    color: theme.colors.text.secondary,
    textDecoration: 'none',
  },
};
