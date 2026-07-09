'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { toast } from 'sonner';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import {
  inviteClient,
  cancelInvite,
  getPendingClientInvites,
} from '@/lib/services/portal-organizations';
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
  const [existingInviteId, setExistingInviteId] = useState<string | null>(null);
  const [cancellingExisting, setCancellingExisting] = useState(false);
  const { userData } = usePortalAuth();
  const t = usePortalTranslations();

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('clientInvite.errors.email')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<InviteClientFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: preSelectedEmail || '',
    },
  });

  const handleCancelAndResend = async (email: string) => {
    if (!existingInviteId) return;

    setCancellingExisting(true);
    try {
      await cancelInvite(existingInviteId);
      setExistingInviteId(null);
      setError(null);
      toast.success('Previous invitation cancelled');
      // Now try to send again
      await onSubmit({ email });
    } catch (err) {
      console.error('Failed to cancel existing invite:', err);
      toast.error('Failed to cancel previous invitation');
    } finally {
      setCancellingExisting(false);
    }
  };

  const onSubmit = async (data: InviteClientFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!userData) throw new Error(t('common.notAuthenticated'));

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

      toast.success(t('clientInvite.success'));
      onSuccess(invite.code);
    } catch (error: unknown) {
      console.error('Client invite error:', error);
      const errorMsg =
        error instanceof Error ? error.message : t('clientInvite.errors.generic');

      // Check if error is about existing invitation (match both "invite" and "invitation")
      if (errorMsg.toLowerCase().includes('already been sent to this email')) {
        // Fetch the existing invite to get its ID
        try {
          const pendingInvites = await getPendingClientInvites(data.email);
          const existingInvite = pendingInvites.find(
            inv => inv.orgId === orgId && inv.isClientInvite
          );
          if (existingInvite) {
            setExistingInviteId(existingInvite.id);
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing invite:', fetchError);
        }
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop isOpen={true}>
      <ModalContent>
        <ModalHeader title={t('clientInvite.title')} onClose={onCancel} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="space-y-6">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {t('clientInvite.description')}
              </p>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  {t('clientInvite.emailLabel')}
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
                <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 border border-primary-200 dark:border-primary-800">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    {t('clientInvite.linkedRequestsInfo')}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">{error}</p>
                  {existingInviteId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAndResend(getValues('email'))}
                      loading={cancellingExisting}
                      className="mt-2"
                    >
                      Cancel Previous & Resend
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('clientInvite.sendButton')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};
