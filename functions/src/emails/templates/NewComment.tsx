import { Section, Text } from '@react-email/components';
import { EmailHero, Layout, SurfaceCard } from '../components/Layout';
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
      <EmailHero
        eyebrow="New portal message"
        title="You have a new message"
        description={
          <>
            <strong>{userName}</strong> left a comment on <strong>{requestTitle}</strong>.
          </>
        }
      />

      <SurfaceCard>
        <Text style={styles.commentLabel}>Message</Text>
        <Text style={styles.commentText}>"{commentText}"</Text>
      </SurfaceCard>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>Reply in Portal</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  commentLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: '1.4px',
    margin: '0 0 10px',
    textTransform: 'uppercase' as const,
  },
  commentText: {
    borderLeft: `3px solid ${theme.colors.primary}`,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontStyle: 'italic' as const,
    lineHeight: '1.7',
    margin: '0',
    paddingLeft: '16px',
    whiteSpace: 'pre-wrap' as const,
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default NewComment;
