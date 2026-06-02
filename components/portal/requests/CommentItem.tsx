'use client';

import React, { useState } from 'react';
import { Comment } from '@/lib/types/portal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Smile, Reply } from 'lucide-react';
import { addReaction, removeReaction } from '@/lib/services/portal-comments';
import { motion, AnimatePresence } from '@/lib/motion';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslations } from 'next-intl';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReply: (comment: Comment) => void;
  isReply?: boolean;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

// Safely render comment content with @mentions highlighted
const renderSafeContent = (content: string): React.ReactNode => {
  // Split by newlines first, then handle mentions
  const lines = content.split('\n');

  return lines.map((line, lineIndex) => {
    // Match @mentions (username can have spaces if followed by another word)
    const parts = line.split(/(@\w+(?:\s\w+)?)/g);

    return (
      <span key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (part.startsWith('@')) {
            return (
              <span key={partIndex} className="font-bold text-primary-500">
                {part}
              </span>
            );
          }
          return part;
        })}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

export const CommentItem = ({
  comment,
  currentUserId,
  onReply,
  isReply = false,
}: CommentItemProps) => {
  const tA11y = useTranslations('portal.accessibility');
  const [showReactions, setShowReactions] = useState(false);

  // Optimistic reactions state
  const [reactions, setReactions] = useState(comment.reactions || {});

  const handleReaction = async (emoji: string) => {
    const currentReactions = reactions[emoji] || [];
    const hasReacted = currentReactions.includes(currentUserId);

    // Optimistic update
    const previousReactions = { ...reactions };
    setReactions(prev => {
      const newReactions = { ...prev };
      if (hasReacted) {
        newReactions[emoji] = currentReactions.filter(id => id !== currentUserId);
        if (newReactions[emoji].length === 0) delete newReactions[emoji];
      } else {
        newReactions[emoji] = [...currentReactions, currentUserId];
      }
      return newReactions;
    });

    try {
      if (hasReacted) {
        await removeReaction(comment.id, currentUserId, emoji);
      } else {
        await addReaction(comment.id, currentUserId, emoji);
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      // Rollback
      setReactions(previousReactions);
    }

    setShowReactions(false);
  };

  const isAuthor = comment.userId === currentUserId;

  return (
    <div
      className={cn(
        'group relative flex gap-3 transition-all',
        isReply ? 'mt-3 ms-12' : 'mt-6',
        isAuthor ? 'flex-row-reverse' : 'flex-row' // Keep threading consistent, but author styling different?
        // Actually for threading, usually all aligned left. Let's stick to left alignment for business chat but style current user differently.
      )}
      onMouseEnter={() => {}}
      onMouseLeave={() => {
        setShowReactions(false);
      }}
    >
      <div className={cn('flex-shrink-0', isAuthor && 'order-last')}>
        <Avatar
          name={comment.userName}
          src={comment.userPhotoUrl}
          size="md"
          className="w-8 h-8 shadow-md"
        />
      </div>

      {/* Content */}
      <div className={cn('flex flex-col max-w-[85%]', isAuthor && 'items-end')}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="portal-label-sm text-[10px]">
            {comment.userName}
          </span>
          <span className="text-[9px] font-bold text-surface-300 dark:text-surface-600 uppercase tracking-tighter">
            {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'h:mm a') : 'Now'}
          </span>
        </div>

        <div className="relative group/bubble">
          <div
            className={cn(
              'p-3.5 rounded-2xl text-sm shadow-sm font-medium leading-relaxed relative z-dropdown',
              isAuthor
                ? 'bg-primary-600 text-white rounded-se-none'
                : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-100 dark:border-surface-700 rounded-ss-none'
            )}
          >
            {renderSafeContent(comment.content)}
          </div>

          {/* Action strip (Reactions, Reply) */}
          <div
            className={cn(
              'absolute top-full mt-1 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity',
              isAuthor ? 'end-0' : 'start-0'
            )}
          >
            <button
              type="button"
              onClick={() => setShowReactions(!showReactions)}
              aria-expanded={showReactions}
              aria-label={tA11y('addReaction')}
              className="portal-focus-ring p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <Smile size={14} />
            </button>
            <button
              type="button"
              onClick={() => onReply(comment)}
              aria-label={tA11y('replyToComment')}
              className="portal-focus-ring p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <Reply size={14} />
            </button>

            {/* Emoji Picker Popup */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-full mb-2 bg-white dark:bg-surface-800 rounded-full shadow-lg border border-surface-100 dark:border-surface-700 p-1 flex items-center gap-0.5 z-sticky"
                >
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReaction(emoji)}
                      className="portal-focus-ring w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-50 dark:hover:bg-surface-700 text-lg transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Existing Reactions display */}
          {Object.keys(reactions).length > 0 && (
            <div
              className={cn(
                'absolute -bottom-3 flex items-center gap-1',
                isAuthor ? 'end-1' : 'start-1'
              )}
            >
              {Object.entries(reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(emoji)}
                  className={cn(
                    'portal-focus-ring flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm border transition-colors',
                    users.includes(currentUserId)
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
