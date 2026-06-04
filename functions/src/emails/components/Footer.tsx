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
      <Text style={styles.brand}>CartShift Studio</Text>
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
    padding: `${theme.spacing.s8} ${theme.spacing.s10}`,
    backgroundColor: theme.colors.navy,
    textAlign: 'center' as const,
  },
  divider: {
    borderColor: '#20314a',
    margin: `0 0 ${theme.spacing.s6}`,
  },
  brand: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    letterSpacing: '1.6px',
    margin: '0 0 10px',
  },
  text: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.inverseMuted,
    margin: '0 0 4px',
    lineHeight: '1.5',
  },
  subText: {
    fontSize: theme.fontSize.xs,
    color: '#8798ad',
    margin: '0 0 16px',
  },
  utilityLinks: {
    fontSize: theme.fontSize.xs,
    color: '#8798ad',
  },
  link: {
    color: theme.colors.cyan,
    textDecoration: 'none',
  },
};
