import { Section, Text } from '@react-email/components';
import { EmailHero, Layout, SurfaceCard } from '../components/Layout';
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
      <EmailHero
        eyebrow="Progress update"
        title="Milestone completed"
        description={
          <>
            A key step is finished for <strong>{requestTitle}</strong>.
          </>
        }
      />

      <SurfaceCard tone="success" align="center">
        <Text style={styles.mark}>Done</Text>
        <Text style={styles.label}>Completed milestone</Text>
        <Text style={styles.milestoneTitle}>{milestoneTitle}</Text>
      </SurfaceCard>

      <Text style={styles.message}>
        The timeline has been updated with the latest progress, deliverables, and next steps.
      </Text>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Progress</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  mark: {
    backgroundColor: theme.colors.success.bg,
    border: `1px solid ${theme.colors.success.border}`,
    borderRadius: theme.borderRadius.full,
    color: theme.colors.success.text,
    display: 'inline-block',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: '1.2px',
    margin: '0 0 18px',
    padding: '8px 16px',
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.success.text,
    letterSpacing: '1px',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
  },
  milestoneTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.success.text,
    margin: '0',
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

export default MilestoneCompleted;
