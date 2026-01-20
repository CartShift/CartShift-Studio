'use client';

import { useState, useEffect } from 'react';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateOrganization } from '@/lib/services/portal-organizations';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { PortalUser, Organization } from '@/lib/types/portal';
import { useTranslations } from 'next-intl';

type TranslationFunction = ReturnType<typeof useTranslations>;

const editOrgSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .min(3, t('organization.createForm.errors.name' as any))
      .max(100, t('organization.createForm.errors.nameLong' as any)),
    website: z
      .string()
      .url(t('organization.createForm.errors.website' as any))
      .optional()
      .or(z.literal('')),
    industry: z
      .string()
      .min(2, t('organization.createForm.errors.industry' as any))
      .optional()
      .or(z.literal('')),
    responsibleAgencyUserId: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
  });

type EditOrgFormData = z.infer<ReturnType<typeof editOrgSchema>>;

interface EditClientModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditClientModal = ({
  organization,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) => {
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyMembers, setAgencyMembers] = useState<PortalUser[]>([]);
  const t = useTranslations('portal');

  const schema = editOrgSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditOrgFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      website: organization.website || '',
      industry: organization.industry || '',
      responsibleAgencyUserId: organization.responsibleAgencyUserId || '',
      status: organization.status || 'active',
    },
  });

  // Reset form when organization changes
  useEffect(() => {
    reset({
      name: organization.name,
      website: organization.website || '',
      industry: organization.industry || '',
      responsibleAgencyUserId: organization.responsibleAgencyUserId || '',
      status: organization.status || 'active',
    });
  }, [organization, reset]);

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
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const onSubmit = async (data: EditOrgFormData) => {
    set(true);
    setError(null);

    try {
      await updateOrganization(organization.id, {
        name: data.name,
        website: data.website || undefined,
        industry: data.industry || undefined,
        responsibleAgencyUserId: data.responsibleAgencyUserId || null,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Update organization error:', error);
      setError(error instanceof Error ? error.message : t('common.error' as any));
    } finally {
      set(false);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('agency.clients.detail.editClient' as any)} onClose={onClose} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody scrollable className="space-y-5">
            <Input
              label={t('organization.createForm.nameLabel' as any)}
              placeholder={t('organization.createForm.namePlaceholder' as any)}
              error={errors.name?.message}
              {...register('name')}
              className="font-outfit"
            />

            <Input
              label={t('organization.createForm.websiteLabel' as any)}
              type="url"
              placeholder={t('organization.createForm.websitePlaceholder' as any)}
              error={errors.website?.message}
              {...register('website')}
              className="font-outfit"
            />

            <Input
              label={t('organization.createForm.industryLabel' as any)}
              placeholder={t('organization.createForm.industryPlaceholder' as any)}
              error={errors.industry?.message}
              {...register('industry')}
              className="font-outfit"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-700 dark:text-surface-300">
                {t('agency.clients.detail.info.responsibleAgent' as any)}
              </label>
              <select
                className="w-full rounded-xl border transition-all duration-200 bg-white dark:bg-surface-900/80 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none h-10 text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)] border-surface-200/80 dark:border-white/[0.08] hover:border-surface-300 dark:hover:border-white/[0.12] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:ring-primary-400/20 dark:focus:border-primary-400 px-3 font-outfit"
                {...register('responsibleAgencyUserId')}
              >
                <option value="">{t('agency.clients.detail.info.unassigned' as any)}</option>
                {agencyMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-700 dark:text-surface-300">
                {t('agency.clients.detail.info.status' as any)}
              </label>
              <select
                className="w-full rounded-xl border transition-all duration-200 bg-white dark:bg-surface-900/80 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none h-10 text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)] border-surface-200/80 dark:border-white/[0.08] hover:border-surface-300 dark:hover:border-white/[0.12] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:ring-primary-400/20 dark:focus:border-primary-400 px-3 font-outfit"
                {...register('status')}
              >
                <option value="active">{t('agency.clients.badge.active' as any)}</option>
                <option value="inactive">{t('agency.clients.badge.inactive' as any)}</option>
                <option value="suspended">{t('agency.clients.badge.suspended' as any)}</option>
              </select>
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
              onClick={onClose}
              disabled={loading}
              className="flex-1 font-outfit"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={loading} className="flex-1 font-outfit">
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};
