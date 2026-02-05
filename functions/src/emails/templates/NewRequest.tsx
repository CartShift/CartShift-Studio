import { Section, Text, Heading, Hr } from '@react-email/components';
import { Layout } from '../components/Layout';
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
      <Heading style={styles.heading}>New Request Received</Heading>
      <Text style={styles.intro}>
        <strong>{clientName}</strong> from <strong>{organizationName}</strong> has submitted a new
        request.
      </Text>

      <Section style={styles.card}>
        <InfoRow label="Title" value={requestTitle} />
        <InfoRow label="Type" value={requestType} />
        <InfoRow
          label="Priority"
          value={<StatusBadge type={priorityType}>{requestPriority}</StatusBadge>}
        />
        <Hr style={{ borderColor: theme.colors.border, margin: '12px 0' }} />
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.description}>"{requestDescription}"</Text>
      </Section>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Request in Portal</ActionButton>
      </Section>

      <Text style={styles.idText}>Request ID: {requestId}</Text>
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
    fontStyle: 'italic' as const,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  action: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  idText: {
    textAlign: 'center' as const,
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
  },
};

export default NewRequest;
