import { Section, Text, Heading } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { theme } from '../theme';

interface MilestoneCompletedProps {
  requestTitle: string;
  milestoneTitle: string;
  actionUrl: string;
}

export const MilestoneCompleted = ({
  requestTitle,
  milestoneTitle,
  actionUrl,
}: MilestoneCompletedProps) => {
  return (
    <Layout
      title="Milestone Completed"
      preview={`Milestone "${milestoneTitle}" has been completed`}
    >
      <Section style={styles.iconContainer}>
        <Text style={styles.icon}>🎯</Text>
      </Section>

      <Heading style={styles.heading}>Milestone Reached!</Heading>

      <Text style={styles.intro}>
        Progress update for <strong>{requestTitle}</strong>.
      </Text>

      <Section style={styles.card}>
        <Text style={styles.label}>COMPLETED MILESTONE</Text>
        <Text style={styles.milestoneTitle}>{milestoneTitle}</Text>
      </Section>

      <Text style={styles.message}>
        We are making great progress on your project. You can view the updated timeline and details
        in the portal.
      </Text>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Progress</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  iconContainer: {
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
    margin: '0',
  },
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 16px',
    color: theme.colors.text.primary,
  },
  intro: {
    textAlign: 'center' as const,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: '32px',
  },
  card: {
    backgroundColor: theme.colors.success.bg,
    border: `1px solid ${theme.colors.success.text}`,
    borderRadius: theme.borderRadius.md,
    padding: '24px',
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.success.text,
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  milestoneTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.success.text,
    margin: '0',
  },
  message: {
    textAlign: 'center' as const,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.base,
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default MilestoneCompleted;
