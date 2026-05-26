import { Section, Text, Heading, Hr } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { InfoRow } from '../components/InfoRow';
import { theme } from '../theme';

interface ContactFormNotificationProps {
  name: string;
  email: string;
  company?: string | null;
  projectType?: string | null;
  message?: string | null;
  locale: string;
  leadsUrl: string;
}

export const ContactFormNotification = ({
  name,
  email,
  company,
  projectType,
  message,
  locale,
  leadsUrl,
}: ContactFormNotificationProps) => {
  const isHe = locale === 'he';
  const title = isHe ? 'פנייה חדשה מהאתר' : 'New website inquiry';
  const intro = isHe
    ? 'התקבלה פנייה חדשה מטופס יצירת הקשר.'
    : 'A new high-intent inquiry was submitted via the contact form.';

  return (
    <Layout title={title} preview={`${name} — ${projectType || 'inquiry'}`}>
      <Heading style={styles.heading}>{title}</Heading>
      <Text style={styles.intro}>{intro}</Text>

      <Section style={styles.card}>
        <InfoRow label={isHe ? 'שם' : 'Name'} value={name} />
        <InfoRow label={isHe ? 'אימייל' : 'Email'} value={email} />
        {company ? <InfoRow label={isHe ? 'חברה' : 'Company'} value={company} /> : null}
        {projectType ? (
          <InfoRow label={isHe ? 'סוג פרויקט' : 'Project type'} value={projectType} />
        ) : null}
        <InfoRow label={isHe ? 'שפה' : 'Locale'} value={locale.toUpperCase()} />
        {message ? (
          <>
            <Hr style={{ borderColor: theme.colors.border, margin: '12px 0' }} />
            <Text style={styles.label}>{isHe ? 'הודעה:' : 'Message:'}</Text>
            <Text style={styles.description}>{message}</Text>
          </>
        ) : null}
      </Section>

      <Section style={styles.action}>
        <ActionButton href={leadsUrl}>
          {isHe ? 'פתיחת ליד במערכת' : 'View in leads dashboard'}
        </ActionButton>
      </Section>

      <Text style={styles.replyHint}>
        {isHe
          ? `השיבו ישירות ל-${email} כדי להגיב במהירות.`
          : `Reply directly to ${email} for a fast response.`}
      </Text>
    </Layout>
  );
};

const styles = {
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 24px',
    color: theme.colors.text.primary,
  },
  intro: {
    fontSize: theme.fontSize.base,
    lineHeight: '1.6',
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: '24px',
    borderRadius: theme.borderRadius.md,
    marginBottom: '32px',
    border: `1px solid ${theme.colors.border}`,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: '8px',
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  action: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  replyHint: {
    textAlign: 'center' as const,
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
  },
};

export default ContactFormNotification;
