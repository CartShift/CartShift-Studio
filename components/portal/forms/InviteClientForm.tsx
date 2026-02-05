'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { inviteClient } from '@/lib/services/portal-organizations';
import { getRequestsByClientEmail } from '@/lib/services/portal-requests';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';

interface InviteClientFormProps {
  orgId: string;
  onSuccess: (inviteCode: string) => void;
  onCancel: () => void;
  preSelectedEmail?: string;
}

interface InviteClientFormData {
  email: string;
}

export const InviteClientForm = ({
  orgId,
  onSuccess,
  onCancel,
  preSelectedEmail,
}: InviteClientFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData } = usePortalAuth();
  const t = useTranslations();

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('portal.clientInvite.errors.email')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteClientFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: preSelectedEmail || '',
    },
  });

  const onSubmit = async (data: InviteClientFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!userData) throw new Error(t('portal.common.notAuthenticated'));

      // Find all requests for this client email
      const clientRequests = await getRequestsByClientEmail(orgId, data.email);
      const requestIds = clientRequests.map(req => req.id);

      // Create the invitation
      const invite = await inviteClient(
        orgId,
        data.email,
        userData.id,
        userData.name || userData.email,
        requestIds
      );

      toast.success(t('portal.clientInvite.success'));
      onSuccess(invite.code);
    } catch (error: unknown) {
      console.error('Client invite error:', error);
      const errorMsg =
        error instanceof Error ? error.message : t('portal.clientInvite.errors.generic');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop isOpen={true}>
      <ModalContent>
        <ModalHeader title={t('portal.clientInvite.title')} onClose={onCancel} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="space-y-6">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {t('portal.clientInvite.description')}
              </p>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  {t('portal.clientInvite.emailLabel')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {preSelectedEmail && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('portal.clientInvite.linkedRequestsInfo')}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              {t('portal.common.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('portal.clientInvite.sendButton')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};
