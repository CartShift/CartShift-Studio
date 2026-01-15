'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
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

export const InviteTeamMemberForm = ({
  orgId,
  isAgency = false,
  onSuccess,
  onCancel,
}: InviteTeamMemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData } = usePortalAuth();
  const t = useTranslations();

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('portal.team.inviteForm.errors.email')),
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
      if (!userData) throw new Error(t('portal.common.notAuthenticated'));

      if (isAgency) {
        await inviteAgencyMember(
          data.email,
          data.role,
          userData.id,
          userData.name || userData.email
        );
      } else if (orgId) {
        await inviteTeamMember(
          orgId,
          data.email,
          data.role,
          userData.id,
          userData.name || userData.email
        );
      } else {
        throw new Error('Organization ID is required for client invites');
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Invite error:', error);
      setError(error instanceof Error ? error.message : t('portal.team.inviteForm.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = useMemo(() => {
    const options = [
      { value: 'admin', label: t('portal.team.inviteForm.roles.admin') },
      { value: 'member', label: t('portal.team.inviteForm.roles.member') },
      { value: 'viewer', label: t('portal.team.inviteForm.roles.viewer') },
    ];

    if (isAgency) {
      // Specific order for agency: Admin, Sales, Dev, Member, Viewer
      return [
        { value: 'admin', label: t('portal.team.inviteForm.roles.admin') },
        { value: 'sales_manager', label: t('portal.team.inviteForm.roles.sales_manager') },
        { value: 'developer', label: t('portal.team.inviteForm.roles.developer') },
        { value: 'member', label: t('portal.team.inviteForm.roles.member') },
        { value: 'viewer', label: t('portal.team.inviteForm.roles.viewer') },
      ];
    }

    return options;
  }, [isAgency, t]);

  return (
    <ModalBackdrop isOpen={true} onClick={onCancel}>
      <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('portal.team.inviteForm.title')} onClose={onCancel} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-5">
            <Input
              label={t('portal.team.inviteForm.emailLabel')}
              type="email"
              placeholder={t('portal.team.inviteForm.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                {t('portal.team.inviteForm.roleLabel')}
              </label>
              <select
                {...register('role')}
                className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-white"
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {t('portal.team.inviteForm.cancel')}
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? t('portal.team.inviteForm.sending') : t('portal.team.inviteForm.submit')}
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
