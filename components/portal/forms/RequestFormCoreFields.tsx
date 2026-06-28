'use client';

import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PortalFormField, PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { PRIORITY_CONFIG } from '@/lib/types/portal';

type RequestFormCoreValues = {
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'optimization' | 'content' | 'design' | 'other';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
};

interface RequestFormCoreFieldsProps {
  register: UseFormRegister<RequestFormCoreValues>;
  errors: FieldErrors<RequestFormCoreValues>;
  typeOptions: { value: string; label: string }[];
  titleClassName?: string;
}

export function RequestFormCoreFields({
  register,
  errors,
  typeOptions,
  titleClassName,
}: RequestFormCoreFieldsProps) {
  const t = useTranslations();

  const priorityOptions = Object.keys(PRIORITY_CONFIG).map(priority => ({
    value: priority,
    label: t(`portal.requests.priority.${priority.toLowerCase()}` as Parameters<typeof t>[0]),
  }));

  return (
    <div className="space-y-6">
      <Input
        label={t('portal.requests.form.titleLabel')}
        placeholder={t('portal.requests.form.titlePlaceholder')}
        error={errors.title?.message}
        {...register('title')}
        className={titleClassName}
      />

      <PortalFormGrid className="md:grid-cols-2">
        <Select
          label={t('portal.requests.form.categoryLabel')}
          error={errors.type?.message}
          placeholder={t('portal.requests.form.categorySelect')}
          options={typeOptions}
          {...register('type')}
        />
        <Select
          label={t('portal.requests.form.priorityLabel')}
          options={priorityOptions}
          {...register('priority')}
        />
      </PortalFormGrid>

      <PortalFormField label={t('portal.requests.form.detailsLabel')} error={errors.description?.message}>
        <Textarea
          {...register('description')}
          rows={6}
          placeholder={t('portal.requests.form.detailsPlaceholder')}
          className="rounded-3xl py-4 resize-none text-sm font-medium leading-relaxed"
        />
      </PortalFormField>
    </div>
  );
}

export type { RequestFormCoreValues };
