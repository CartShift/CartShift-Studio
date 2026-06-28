'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
import { useTranslations } from 'next-intl';
import { X, Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Organization {
  id: string;
  name: string;
}

interface InlineRequestFormProps {
  columnId: string;
  organizations: Organization[];
  onSubmit: (title: string, columnId: string, orgId: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InlineRequestForm({
  columnId,
  organizations,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InlineRequestFormProps) {
  const [title, setTitle] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || '');
  const t = useTranslations('portal'); // Ensure 'portal' namespace is loaded
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !selectedOrgId) return;
    await onSubmit(title, columnId, selectedOrgId);
    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Card className="p-3 mb-3 border-surface-200 dark:border-surface-800 shadow-lg animate-in fade-in zoom-in-95 duration-200">
      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-3">
          <Input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('requests.form.titlePlaceholder')} // Ensure this key exists or fallback
            className="h-9 text-sm"
            disabled={isSubmitting}
          />

          {organizations.length > 0 && (
            <PortalFormField label={t('requests.form.clientLabel')}>
              <Select
                value={selectedOrgId}
                onChange={e => setSelectedOrgId(e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-xs"
                options={organizations.map(org => ({
                  value: org.id,
                  label: org.name,
                }))}
              />
            </PortalFormField>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X size={14} className="me-1" />
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            size="xs"
            variant="primary"
            disabled={!title.trim() || !selectedOrgId || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin me-1" />
            ) : (
              <Check size={14} className="me-1" />
            )}
            {t('common.add')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
