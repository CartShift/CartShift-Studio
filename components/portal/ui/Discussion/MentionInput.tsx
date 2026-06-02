'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { PortalUser } from '@/lib/types/portal';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  users: PortalUser[];
}

export const MentionInput = ({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  users,
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('portal.requests.detail');

  const filteredUsers = users
    .filter(user =>
      (user.name?.toLowerCase() || user.email.toLowerCase()).includes(mentionQuery.toLowerCase())
    )
    .slice(0, 5);

  useEffect(() => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const query = textBeforeCursor.slice(lastAtPos + 1);
      // Only show suggestions if no space after @ OR if we want to support spaces in names (more complex)
      // For now, let's allow it but stop if there's a newline
      if (!query.includes('\n')) {
        setMentionQuery(query);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        return;
      }
    }
    setShowSuggestions(false);
  }, [value, cursorPosition]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const insertMention = (user: PortalUser) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const before = value.slice(0, lastAtPos);
      const after = value.slice(cursorPosition);
      const mentionName = user.name || user.email;
      const newValue = `${before}@${mentionName} ${after}`;
      onChange(newValue);
      setShowSuggestions(false);

      // Reset cursor position after insert
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = lastAtPos + mentionName.length + 2;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart || 0);
  };

  return (
    <div className="relative group">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="portal-input min-h-[80px] py-4 resize-none bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800 focus:bg-white dark:focus:bg-surface-950 transition-all font-medium w-full"
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute bottom-full start-0 mb-2 w-64 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700 overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="p-2 border-b border-surface-100 dark:border-surface-700 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
            {t('mentionMember')}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={cn(
                  'portal-focus-ring w-full text-start px-3 py-2 flex items-center gap-2 transition-colors outline-none',
                  index === suggestionIndex
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={12} className="text-surface-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || t('unknownUser')}</p>
                  <p className="text-xs text-surface-400 truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
