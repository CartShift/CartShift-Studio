import { Section, Text } from '@react-email/components';
import { EmailHero, FinePrint, Layout, SurfaceCard } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { theme } from '../theme';

interface TeamInviteProps {
  inviterName?: string;
  organizationName: string;
  actionUrl: string;
  orgId?: string | null;
  locale?: 'en' | 'he';
}

const copy = {
  en: {
    title: 'You are invited to CartShift Studio',
    preview: (organizationName: string) => `Join ${organizationName} on CartShift Studio`,
    intro: (inviterName: string, organizationName: string) =>
      `${inviterName} invited you to join ${organizationName} on CartShift Studio.`,
    expiry: 'This invitation expires in 7 days.',
    body: 'Accept the invitation to access the client portal, requests, files, proposals, and project updates.',
    action: 'Accept invitation',
    safety: 'If you were not expecting this invitation, you can safely ignore this email.',
    orgLabel: 'Organization ID',
  },
  he: {
    title: 'הוזמנתם ל-CartShift Studio',
    preview: (organizationName: string) => `הצטרפות אל ${organizationName} ב-CartShift Studio`,
    intro: (inviterName: string, organizationName: string) =>
      `${inviterName} הזמין/ה אתכם להצטרף אל ${organizationName} ב-CartShift Studio.`,
    expiry: 'ההזמנה זמינה למשך 7 ימים.',
    body: 'אשרו את ההזמנה כדי להיכנס לפורטל הלקוחות, בקשות, קבצים, הצעות מחיר ועדכוני פרויקט.',
    action: 'אישור ההזמנה',
    safety: 'אם לא ציפיתם להזמנה הזו, אפשר להתעלם מהאימייל בבטחה.',
    orgLabel: 'מזהה ארגון',
  },
};

export const TeamInvite = ({
  inviterName = 'A team member',
  organizationName,
  actionUrl,
  orgId,
  locale = 'en',
}: TeamInviteProps) => {
  const activeLocale = locale === 'he' ? 'he' : 'en';
  const isRtl = activeLocale === 'he';
  const text = copy[activeLocale];
  const align = isRtl ? ('right' as const) : ('left' as const);

  return (
    <Layout locale={activeLocale} title={text.title} preview={text.preview(organizationName)}>
      <EmailHero
        eyebrow={isRtl ? 'הזמנה לפורטל' : 'Portal invitation'}
        title={text.title}
        description={text.intro(inviterName, organizationName)}
        align={align}
      />

      <SurfaceCard tone="info" align={align}>
        <Text style={{ ...styles.organizationLabel, textAlign: align }}>
          {isRtl ? 'ארגון' : 'Organization'}
        </Text>
        <Text style={{ ...styles.organizationName, textAlign: align }}>{organizationName}</Text>
        <Text style={{ ...styles.noticeText, textAlign: align }}>{text.expiry}</Text>
      </SurfaceCard>

      <Text style={{ ...styles.body, textAlign: align }}>{text.body}</Text>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>{text.action}</ActionButton>
      </Section>

      {orgId ? (
        <Text style={styles.meta}>
          {text.orgLabel}: {orgId}
        </Text>
      ) : null}

      <FinePrint align={align}>{text.safety}</FinePrint>
    </Layout>
  );
};

const styles = {
  organizationLabel: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: '1.4px',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
  },
  organizationName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    lineHeight: '1.35',
    margin: '0 0 14px',
  },
  noticeText: {
    color: theme.colors.info.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    lineHeight: '1.6',
    margin: '0',
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.base,
    lineHeight: '1.7',
    margin: '0 0 28px',
  },
  action: {
    margin: '0 0 24px',
    textAlign: 'center' as const,
  },
  meta: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    lineHeight: '1.5',
    margin: '0 0 18px',
    textAlign: 'center' as const,
  },
};

export default TeamInvite;
