import { Section, Text, Heading } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { theme } from '../theme';

interface NewCommentProps {
  userName: string;
  requestTitle: string;
  commentText: string;
  actionUrl: string;
}

export const NewComment = ({ userName, requestTitle, commentText, actionUrl }: NewCommentProps) => {
  return (
    <Layout title="New Message" preview={`${userName} sent a message regarding ${requestTitle}`}>
      <Heading style={styles.heading}>New Message</Heading>

      <Text style={styles.intro}>
        <strong>{userName}</strong> left a comment on <strong>{requestTitle}</strong>.
      </Text>

      <Section style={styles.commentBox}>
        <Text style={styles.commentLabel}>MESSAGE:</Text>
        <Text style={styles.commentText}>"{commentText}"</Text>
      </Section>

      <Section style={styles.action}>
        <ActionButton href={actionUrl} variant="secondary">
          Reply in Portal
        </ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  heading: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 24px',
    color: theme.colors.text.primary,
  },
  intro: {
    textAlign: 'center' as const,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: '24px',
  },
  commentBox: {
    backgroundColor: '#fff',
    borderLeft: `4px solid ${theme.colors.primary}`,
    borderTop: `1px solid ${theme.colors.border}`,
    borderRight: `1px solid ${theme.colors.border}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    padding: '24px',
    marginBottom: '32px',
  },
  commentLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text.muted,
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  commentText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    fontStyle: 'italic' as const,
    lineHeight: '1.6',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default NewComment;
