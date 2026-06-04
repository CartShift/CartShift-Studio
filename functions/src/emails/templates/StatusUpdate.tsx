import { Section, Text } from '@react-email/components';
import { EmailHero, Layout, SurfaceCard } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { StatusBadge, StatusType } from '../components/StatusBadge';
import { theme } from '../theme';

interface StatusUpdateProps {
  requestTitle: string;
  statusLabel: string;
  statusStyle?: string; // Legacy prop, we'll try to deduce the type or ignore it
  actionUrl: string;
  requestId: string;
}

export const StatusUpdate = ({ requestTitle, statusLabel, actionUrl }: StatusUpdateProps) => {
  // Map label to visual type
  const getStatusType = (label: string): StatusType => {
    const l = label.toLowerCase();
    if (l.includes('progress')) return 'info';
    if (l.includes('review')) return 'warning';
    if (l.includes('delivered') || l.includes('paid')) return 'success';
    if (l.includes('closed')) return 'neutral';
    return 'neutral';
  };

  const statusType = getStatusType(statusLabel);

  return (
    <Layout title={`Status Update: ${requestTitle}`} preview={`Your request is now ${statusLabel}`}>
      <EmailHero
        eyebrow="Project status"
        title="Your request has moved forward"
        description="A status change was posted in the portal. The latest comments, files, and next steps are available there."
      />

      <SurfaceCard tone="info" align="center">
        <Text style={styles.subheading}>Your request</Text>
        <Text style={styles.title}>{requestTitle}</Text>
        <Text style={styles.connector}>Updated to</Text>
        <StatusBadge type={statusType}>{statusLabel}</StatusBadge>
      </SurfaceCard>

      <Text style={styles.message}>
        Open the request to review what changed and keep the work moving with the team.
      </Text>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Request</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  subheading: {
    margin: '0 0 8px',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  title: {
    margin: '0 0 16px',
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  connector: {
    display: 'block',
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
  },
  message: {
    textAlign: 'center' as const,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.base,
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default StatusUpdate;
