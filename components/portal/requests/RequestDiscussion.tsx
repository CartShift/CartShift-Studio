'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { CommentItem } from './CommentItem';
import { MentionInput } from '@/components/portal/ui/Discussion/MentionInput';
import { Comment, PortalUser } from '@/lib/types/portal';

interface RequestDiscussionProps {
  comments: Comment[];
  currentUser: PortalUser | null;
  agencyTeam: PortalUser[];
  onSendMessage: (content: string, replyToCommentId?: string) => Promise<void>;
  isSubmitting: boolean;
}

export const RequestDiscussion = ({
  comments,
  currentUser,
  agencyTeam,
  onSendMessage,
  isSubmitting,
}: RequestDiscussionProps) => {
  const t = useTranslations('portal'); // Assuming 'portal' namespace
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUser) return;

    await onSendMessage(newComment, replyTo?.id);
    setNewComment('');
    setReplyTo(null);
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    // Focus input?
    // Implementation detail: MentionInput ref needed for focus, or just auto-focus on rerender if possible?
    // For now simple state change.
  };

  // Group comments for threading view?
  // Detailed threading: Top level comments, with nested replies.
  // Simple threading: Flat list but replies have visual indicator?
  // Implementation Plan said: "Implement threaded view (rendering replies nested or via 'show replies')"
  // Let's do a simple nesting: filter top level, then find children.

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <Card
      noPadding
      className="flex flex-col border-surface-200 dark:border-surface-800 shadow-sm bg-surface-50/50 dark:bg-surface-900/10 min-h-[500px] overflow-hidden animate-in slide-in-from-end-4 duration-500"
    >
      <div className="p-6 pb-0">
        <CardSectionTitle icon={MessageSquare} iconClassName="text-primary-500">
          {t('requests.detail.discussion')}
        </CardSectionTitle>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[600px] scrollbar-hide"
      >
        {comments.length > 0 ? (
          rootComments.map(comment => (
            <div key={comment.id} className="flex flex-col">
              <CommentItem
                comment={comment}
                currentUserId={currentUser?.id || ''}
                onReply={handleReply}
              />

              {/* Render Replies */}
              {getReplies(comment.id).map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUser?.id || ''}
                  onReply={handleReply}
                  isReply
                />
              ))}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40 space-y-2">
            <MessageSquare size={48} className="text-surface-300" />
            <div>
              <p className="text-sm font-bold text-surface-400 font-outfit uppercase tracking-widest">
                {t('requests.detail.emptyMessages')}
              </p>
              <p className="text-xs text-surface-500">{t('requests.detail.emptyMessagesDesc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950">
        {/* Reply Context */}
        {replyTo && (
          <div className="flex items-center justify-between bg-primary-50/60 dark:bg-primary-500/10 p-2 rounded-lg mb-2 text-xs ring-1 ring-primary-500/20">
            <span className="text-surface-500">
              {t('requests.detail.replyingTo')}{' '}
              <span className="font-bold">{replyTo.userName}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="portal-focus-ring text-surface-400 hover:text-surface-600 rounded-md px-2 py-1 min-h-[44px]"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        <div className="relative group">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
            placeholder={t('requests.detail.placeholder')}
            users={agencyTeam} // Also include current user? Usually just others.
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !newComment.trim()}
            aria-label={t('accessibility.sendMessage')}
            className="portal-focus-ring absolute end-3 bottom-3 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </Card>
  );
};
