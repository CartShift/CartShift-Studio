'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { createOrganization } from '@/lib/services/portal-organizations';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { PortalUser } from '@/lib/types/portal';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';

type TranslationFunction = ReturnType<typeof useTranslations<'portal'>>;

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
    responsibleAgencyUserId: z.string().optional(),
  });

type OrgFormData = z.infer<ReturnType<typeof orgSchema>>;

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string) => void;
  onCancel: () => void;
  isClientOrganization?: boolean;
}

export const CreateOrganizationForm = ({
  onSuccess,
  onCancel,
  isClientOrganization = false,
}: CreateOrganizationFormProps) => {
  const { user, userData } = usePortalAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('portal');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema(t)),
  });

  const [agencyMembers, setAgencyMembers] = useState<PortalUser[]>([]);

  // Fetch agency members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getAgencyTeam();
        setAgencyMembers(members);
      } catch (err) {
        console.error('Failed to fetch agency team:', err);
      }
    };
    fetchMembers();
  }, []);

  const onSubmit = async (data: OrgFormData) => {
    if (!user || !userData) {
      setError(t('organization.createForm.errors.auth'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const org = await createOrganization(
        data.name,
        user.uid,
        user.email || userData.email,
        userData.name,
        !isClientOrganization // Don't add creator as member for client orgs
      );

      // Update the org with additional fields if provided
      if (data.website || data.industry || data.responsibleAgencyUserId) {
        const { updateOrganization } = await import('@/lib/services/portal-organizations');
        await updateOrganization(org.id, {
          website: data.website || undefined,
          industry: data.industry || undefined,
          responsibleAgencyUserId: data.responsibleAgencyUserId || undefined,
        });
      }

      onSuccess(org.id);
    } catch (error: unknown) {
      console.error('Create organization error:', error);
      setError(
        error instanceof Error ? error.message : t('organization.createForm.errors.generic')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if document.body is not available
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return (
    <ModalBackdrop isOpen={true} onClick={onCancel}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('organization.createForm.title')} onClose={onCancel} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-5">
            <Input
              label={t('organization.createForm.nameLabel')}
              placeholder={t('organization.createForm.namePlaceholder')}
              error={errors.name?.message}
              {...register('name')}
              className="font-outfit"
              disabled={isSubmitting}
            />

            <Input
              label={t('organization.createForm.websiteLabel')}
              type="url"
              placeholder={t('organization.createForm.websitePlaceholder')}
              error={errors.website?.message}
              {...register('website')}
              className="font-outfit"
              disabled={isSubmitting}
            />

            <Input
              label={t('organization.createForm.industryLabel')}
              placeholder={t('organization.createForm.industryPlaceholder')}
              error={errors.industry?.message}
              {...register('industry')}
              className="font-outfit"
              disabled={isSubmitting}
            />

            <PortalFormField label={t('organization.createForm.responsibleAgentLabel')}>
              <Select
                disabled={isSubmitting}
                options={[
                  {
                    value: '',
                    label: t('organization.createForm.responsibleAgentPlaceholder'),
                  },
                  ...agencyMembers.map(member => ({
                    value: member.id,
                    label: member.name || member.email,
                  })),
                ]}
                {...register('responsibleAgencyUserId')}
              />
            </PortalFormField>

            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/20 rounded-xl p-4">
              <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed font-medium">
                <strong className="font-bold">{t('organization.createForm.note')}</strong>{' '}
                {t('organization.createForm.noteText')}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 font-outfit"
            >
              {t('organization.createForm.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1 font-outfit">
              {isSubmitting
                ? t('organization.createForm.submitting')
                : t('organization.createForm.submit')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};
