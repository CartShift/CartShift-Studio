'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/lib/services/auth';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getPortalHref } from '@/lib/utils/portal-paths';
import { toast } from 'sonner';
import { useBranding } from '@/components/providers/BrandingProvider';
import Image from 'next/image';

const getForgotPasswordSchema = (t: (path: string) => string) =>
  z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
  });

type ForgotPasswordData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

export default function ForgotPasswordClient() {
  const t = useTranslations('portal');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { branding } = useBranding();

  const schema = getForgotPasswordSchema(path => t(path as any));

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(data.email);
      setSentEmail(data.email);
      setEmailSent(true);
      toast.success(t('auth.forgotPassword.success'));
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/user-not-found'
          ? t('auth.errors.userNotFound')
          : firebaseError.code === 'auth/invalid-email'
            ? t('auth.errors.invalidEmail')
            : firebaseError.message || t('auth.errors.generic');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
        <div className="w-full max-w-[400px] space-y-6">
          <Card className="p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                {t('auth.forgotPassword.emailSentTitle')}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t('auth.forgotPassword.emailSentBody', { email: sentEmail })}
              </p>
            </div>

            <Link href={getPortalHref('/login/')} className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft size={16} className="me-2" />
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {branding?.logoUrl ? (
            <div className="relative h-16 w-full flex justify-center">
              <img
                src={branding.logoUrl}
                alt="Logo"
                className={`h-full max-w-[240px] object-contain ${branding.invertLogoInDarkMode ? 'dark:brightness-0 dark:invert' : ''}`}
              />
            </div>
          ) : (
            <div className="w-12 h-12 relative">
              <Image
                src="/images/CarShift-Icon-Colored.png"
                alt="CartShift Studio"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              {t('auth.forgotPassword.title')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              {t('auth.forgotPassword.subtitle')}
            </p>
          </div>
        </div>

        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label={t('auth.forgotPassword.email')}
              type="email"
              placeholder="yours@example.com"
              error={errors.email?.message}
              success={touchedFields.email && !errors.email}
              leftIcon={<Mail size={18} />}
              {...register('email')}
            />

            <FormError message={error} />

            <Button type="submit" loading={loading} className="w-full h-11">
              <span>{t('auth.forgotPassword.submit')}</span>
            </Button>

            <div className="text-center">
              <Link
                href={getPortalHref('/login/')}
                className="text-sm font-medium text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
