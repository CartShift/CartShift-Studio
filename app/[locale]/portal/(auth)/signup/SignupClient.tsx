'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signUpWithEmail } from '@/lib/services/auth';
import { Suspense, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';
import { getPortalPath } from '@/lib/utils/portal-paths';
import {
  calculatePasswordStrength,
  PASSWORD_STRENGTH_COLORS,
  PASSWORD_STRENGTH_LABELS,
} from '@/lib/utils/validation';

type SignupData = z.infer<ReturnType<typeof getSignupSchema>>;

const getSignupSchema = (t: (path: string) => string) =>
  z
    .object({
      name: z.string().min(2, t('auth.errors.nameTooShort')),
      email: z.string().email(t('auth.errors.invalidEmail')),
      password: z
        .string()
        .min(6, t('auth.errors.passwordTooShort'))
        .refine(password => /[a-zA-Z]/.test(password) && /[0-9]/.test(password), {
          message: t('auth.errors.passwordRequirements'),
        }),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('auth.errors.matchPassword'),
      path: ['confirmPassword'],
    });

function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, set] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { navigateToPortal, getPortalHref } = usePortalNavigation();
  const searchParams = useSearchParams();
  const t = useTranslations('portal');
  const redirectPath = searchParams.get('redirect');

  const signupSchema = useMemo(() => getSignupSchema((path: string) => t(path as any)), [t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  // Watch password for strength calculation
  const passwordValue = watch('password', '');

  // Use shared password strength calculator
  const strength = calculatePasswordStrength(passwordValue || '');
  const strengthColors = Object.values(PASSWORD_STRENGTH_COLORS);
  const strengthLabels = Object.values(PASSWORD_STRENGTH_LABELS);

  const onSubmit = async (data: SignupData) => {
    set(true);
    setError(null);
    try {
      await signUpWithEmail(data.email, data.password, data.name);
      navigateToPortal(redirectPath || '/');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/email-already-in-use'
          ? t('portal.auth.errors.emailInUse')
          : firebaseError.code === 'auth/invalid-email'
            ? t('portal.auth.errors.invalidEmail')
            : firebaseError.code === 'auth/weak-password'
              ? t('portal.auth.errors.weakPassword')
              : firebaseError.message || t('portal.auth.errors.generic');
      setError(errorMessage);
    } finally {
      set(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 relative">
          <Image
            src="/images/CarShift-Icon-Colored.png"
            alt="CartShift Studio"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
            {t('auth.signup.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{t('auth.signup.subtitle')}</p>
        </div>
      </div>

      <Card className="p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input
              label={t('auth.signup.fullName')}
              type="text"
              placeholder={t('common.namePlaceholder')}
              error={errors.name?.message}
              success={touchedFields.name && !errors.name}
              leftIcon={<User size={18} />}
              {...register('name')}
            />

            <Input
              label={t('auth.signup.email')}
              type="email"
              placeholder="yours@example.com"
              error={errors.email?.message}
              success={touchedFields.email && !errors.email}
              leftIcon={<Mail size={18} />}
              {...register('email')}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {t('auth.signup.password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  success={touchedFields.password && !errors.password}
                  leftIcon={<Lock size={18} />}
                  className="pe-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors z-10"
                  aria-label={
                    showPassword ? t('portal.auth.hidePassword') : t('portal.auth.showPassword')
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(index => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index < strength
                            ? strengthColors[strength - 1]
                            : 'bg-surface-200 dark:bg-surface-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {strengthLabels[strength - 1] || t('portal.auth.passwordStrength.veryWeak')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {t('auth.signup.confirmPassword')}
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  success={touchedFields.confirmPassword && !errors.confirmPassword}
                  leftIcon={<Lock size={18} />}
                  className="pe-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors z-10"
                  aria-label={
                    showConfirmPassword
                      ? t('portal.auth.hidePassword')
                      : t('portal.auth.showPassword')
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full h-11">
            <span>{t('auth.signup.createAccount')}</span>
            <ArrowRight size={16} />
          </Button>
        </form>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          {t('auth.signup.alreadyHaveAccount')}{' '}
          <Link
            href={
              redirectPath
                ? `${getPortalPath('/login/')}?redirect=${encodeURIComponent(redirectPath)}`
                : getPortalHref('/login/')
            }
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('auth.signup.signIn')}
          </Link>
        </p>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-surface-400 text-xs mt-8">
        <ShieldCheck size={14} />
        <span>{t('auth.signup.secure')}</span>
        <span className="mx-1">•</span>
        <span>&copy; {new Date().getFullYear()} CartShift Studio</span>
      </div>
    </div>
  );
}

export default function SignupClient() {
  const t = useTranslations('portal');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-500">{t('loading.auth.signup')}</p>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
