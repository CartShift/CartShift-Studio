'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalInput } from '@/components/portal/ui/PortalInput';
import { X } from 'lucide-react';
import { createOrganization } from '@/lib/services/portal-organizations';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getPortalPath } from '@/lib/utils/portal-paths';

import { useTranslations } from 'next-intl';

type TranslationFunction = ReturnType<typeof useTranslations>;

const orgSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .min(3, t('organization.createForm.errors.name'))
      .max(100, t('organization.createForm.errors.nameLong')),
    website: z
      .string()
      .url(t('organization.createForm.errors.website'))
      .optional()
      .or(z.literal('')),
    industry: z
      .string()
      .min(2, t('organization.createForm.errors.industry'))
      .optional()
      .or(z.literal('')),
  });

type OrgFormData = z.infer<ReturnType<typeof orgSchema>>;

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string) => void;
  onCancel: () => void;
}

export const CreateOrganizationForm = ({ onSuccess, onCancel }: CreateOrganizationFormProps) => {
  const { user, userData } = usePortalAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('portal');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema(t)),
  });

  const onSubmit = async (data: OrgFormData) => {
    if (!user || !userData) {
      setError(t('organization.createForm.errors.auth'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const org = await createOrganization(
        data.name,
        user.uid,
        user.email || userData.email,
        userData.name
      );

      // Update the org with additional fields if provided
      if (data.website || data.industry) {
        const { updateOrganization } = await import('@/lib/services/portal-organizations');
        await updateOrganization(org.id, {
          website: data.website || undefined,
          industry: data.industry || undefined,
        });
      }

      onSuccess(org.id);
      // Redirect to clean URL - org is stored in context/session
      router.push(getPortalPath('/dashboard/'));
    } catch (error: unknown) {
      console.error('Create organization error:', error);
      setError(
        error instanceof Error ? error.message : t('organization.createForm.errors.generic')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-w-lg w-full border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
            {t('organization.createForm.title')}
          </h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <PortalInput
            label={t('organization.createForm.nameLabel')}
            placeholder={t('organization.createForm.namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
            className="font-outfit"
          />

          <PortalInput
            label={t('organization.createForm.websiteLabel')}
            type="url"
            placeholder={t('organization.createForm.websitePlaceholder')}
            error={errors.website?.message}
            {...register('website')}
            className="font-outfit"
          />

          <PortalInput
            label={t('organization.createForm.industryLabel')}
            placeholder={t('organization.createForm.industryPlaceholder')}
            error={errors.industry?.message}
            {...register('industry')}
            className="font-outfit"
          />

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-xl p-4">
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
              <strong className="font-bold">{t('organization.createForm.note')}</strong>{' '}
              {t('organization.createForm.noteText')}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <PortalButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 font-outfit"
            >
              {t('organization.createForm.cancel')}
            </PortalButton>
            <PortalButton type="submit" isLoading={loading} className="flex-1 font-outfit">
              {loading
                ? t('organization.createForm.submitting')
                : t('organization.createForm.submit')}
            </PortalButton>
          </div>
        </form>
      </div>
    </div>
  );
};
