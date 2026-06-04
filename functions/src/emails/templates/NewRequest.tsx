import { Section, Text, Hr } from '@react-email/components';
import { EmailHero, FinePrint, Layout, SurfaceCard } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { InfoRow } from '../components/InfoRow';
import { theme } from '../theme';

interface NewRequestProps {
  clientName: string;
  organizationName: string;
  requestTitle: string;
  requestDescription: string;
  requestType: string;
  requestPriority: string;
  actionUrl: string;
  requestId: string;
  orgId: string;
}

export const NewRequest = ({
  clientName,
  organizationName,
  requestTitle,
  requestDescription,
  requestType,
  requestPriority,
  actionUrl,
  requestId,
}: NewRequestProps) => {
  const priorityType =
    requestPriority.toLowerCase() === 'urgent' || requestPriority.toLowerCase() === 'high'
      ? 'error'
      : requestPriority.toLowerCase() === 'low'
        ? 'info'
        : 'warning';

  return (
    <Layout title={`New Request: ${requestTitle}`} preview={`New request from ${organizationName}`}>
      <EmailHero
        eyebrow="Agency action required"
        title="New request received"
        description={
          <>
            <strong>{clientName}</strong> from <strong>{organizationName}</strong> submitted a new
            request for review.
          </>
        }
      />

      <SurfaceCard>
        <InfoRow label="Title" value={requestTitle} />
        <InfoRow label="Type" value={requestType} />
        <InfoRow
          label="Priority"
          value={<StatusBadge type={priorityType}>{requestPriority}</StatusBadge>}
        />
        <Hr style={{ borderColor: theme.colors.border, margin: '12px 0' }} />
        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>"{requestDescription}"</Text>
      </SurfaceCard>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Request in Portal</ActionButton>
      </Section>

      <FinePrint>Request ID: {requestId}</FinePrint>
    </Layout>
  );
};

const styles = {
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '700',
    letterSpacing: '0.5px',
    margin: '0 0 8px',
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    fontStyle: 'italic' as const,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  action: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
};

export default NewRequest;
