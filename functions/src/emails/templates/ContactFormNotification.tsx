import { Section, Text, Hr } from '@react-email/components';
import { EmailHero, FinePrint, Layout, SurfaceCard } from '../components/Layout';
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
  const activeLocale = isHe ? 'he' : 'en';
  const align = isHe ? ('right' as const) : ('left' as const);
  const valueAlign = isHe ? ('left' as const) : ('right' as const);

  return (
    <Layout locale={activeLocale} title={title} preview={`${name} — ${projectType || 'inquiry'}`}>
      <EmailHero
        eyebrow={isHe ? 'ליד חדש' : 'New lead'}
        title={title}
        description={intro}
        align={align}
      />

      <SurfaceCard align={align}>
        <InfoRow label={isHe ? 'שם' : 'Name'} value={name} valueAlign={valueAlign} />
        <InfoRow label={isHe ? 'אימייל' : 'Email'} value={email} valueAlign={valueAlign} />
        {company ? (
          <InfoRow label={isHe ? 'חברה' : 'Company'} value={company} valueAlign={valueAlign} />
        ) : null}
        {projectType ? (
          <InfoRow
            label={isHe ? 'סוג פרויקט' : 'Project type'}
            value={projectType}
            valueAlign={valueAlign}
          />
        ) : null}
        <InfoRow
          label={isHe ? 'שפה' : 'Locale'}
          value={locale.toUpperCase()}
          valueAlign={valueAlign}
        />
        {message ? (
          <>
            <Hr style={{ borderColor: theme.colors.border, margin: '12px 0' }} />
            <Text style={{ ...styles.label, textAlign: align }}>{isHe ? 'הודעה' : 'Message'}</Text>
            <Text style={{ ...styles.description, textAlign: align }}>{message}</Text>
          </>
        ) : null}
      </SurfaceCard>

      <Section style={styles.action}>
        <ActionButton href={leadsUrl}>
          {isHe ? 'פתיחת ליד במערכת' : 'View in leads dashboard'}
        </ActionButton>
      </Section>

      <FinePrint>
        {isHe
          ? `השיבו ישירות ל-${email} כדי להגיב במהירות.`
          : `Reply directly to ${email} for a fast response.`}
      </FinePrint>
    </Layout>
  );
};

const styles = {
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '700',
    margin: '0 0 8px',
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
};

export default ContactFormNotification;
