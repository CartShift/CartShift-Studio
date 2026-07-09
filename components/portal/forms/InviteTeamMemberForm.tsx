'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { Select } from '@/components/ui/Select';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { inviteTeamMember, inviteAgencyMember } from '@/lib/services/portal-organizations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { invalidatePortalTeamData } from '@/lib/utils/portal-cache-invalidation';

export const InviteTeamMemberForm = ({
  orgId,
  isAgency = false,
  onSuccess,
  onCancel,
}: InviteTeamMemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData } = usePortalAuth();
  const queryClient = useQueryClient();
  const t = usePortalTranslations();

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('team.inviteForm.errors.email')),
        role: z.enum(['admin', 'sales_manager', 'developer', 'member', 'viewer']),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'member',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!userData) throw new Error(t('common.notAuthenticated'));

      if (isAgency) {
        await inviteAgencyMember(
          data.email,
          data.role,
          userData.id,
          userData.name || userData.email
        );
        invalidatePortalTeamData(queryClient);
      } else if (orgId) {
        await inviteTeamMember(
          orgId,
          data.email,
          data.role,
          userData.id,
          userData.name || userData.email
        );
        invalidatePortalTeamData(queryClient, orgId);
      } else {
        throw new Error('Organization ID is required for client invites');
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Invite error:', error);
      setError(error instanceof Error ? error.message : t('team.inviteForm.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = useMemo(() => {
    const options = [
      { value: 'admin', label: t('team.inviteForm.roles.admin') },
      { value: 'member', label: t('team.inviteForm.roles.member') },
      { value: 'viewer', label: t('team.inviteForm.roles.viewer') },
    ];

    if (isAgency) {
      // Specific order for agency: Admin, Sales, Dev, Member, Viewer
      return [
        { value: 'admin', label: t('team.inviteForm.roles.admin') },
        { value: 'sales_manager', label: t('team.inviteForm.roles.sales_manager') },
        { value: 'developer', label: t('team.inviteForm.roles.developer') },
        { value: 'member', label: t('team.inviteForm.roles.member') },
        { value: 'viewer', label: t('team.inviteForm.roles.viewer') },
      ];
    }

    return options;
  }, [isAgency, t]);

  return (
    <ModalBackdrop isOpen={true} onClick={onCancel}>
      <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('team.inviteForm.title')} onClose={onCancel} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-5">
            <Input
              label={t('team.inviteForm.emailLabel')}
              type="email"
              placeholder={t('team.inviteForm.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
            />

            <Select
              label={t('team.inviteForm.roleLabel')}
              error={errors.role?.message}
              options={roleOptions}
              {...register('role')}
            />

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {t('team.inviteForm.cancel')}
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? t('team.inviteForm.sending') : t('team.inviteForm.submit')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};

interface InviteTeamMemberFormProps {
  orgId?: string;
  isAgency?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface InviteFormData {
  email: string;
  role: 'admin' | 'sales_manager' | 'developer' | 'member' | 'viewer';
}
