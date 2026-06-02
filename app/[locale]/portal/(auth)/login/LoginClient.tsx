'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail, signInWithGoogle } from '@/lib/services/auth';
import { Suspense, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';
import { getPortalPath, getPortalPathnameForRedirect } from '@/lib/utils/portal-paths';
import { toast } from 'sonner';
import { useBranding } from '@/components/providers/BrandingProvider';
import { useLocale } from 'next-intl';

type LoginData = z.infer<ReturnType<typeof getLoginSchema>>;

const getLoginSchema = (t: (path: string) => string) =>
  z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
    password: z.string().min(6, t('auth.errors.weakPassword')),
    rememberMe: z.boolean().optional(),
  });

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, set] = useState(false);
  const [google, setGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { navigateToPortal, getPortalHref } = usePortalNavigation();
  const searchParams = useSearchParams();
  const t = useTranslations('portal');
  const redirectPath = searchParams.get('redirect');
  const locale = useLocale();
  const { branding } = useBranding();

  const loginSchema = useMemo(() => getLoginSchema((path: string) => t(path as any)), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const handleGoogleSignIn = async () => {
    setGoogle(true);
    setError(null);
    try {
      await signInWithGoogle();
      toast.success(t('auth.login.success' as any));
      const targetPath = redirectPath?.includes('/invite/') ? '/dashboard/' : redirectPath || '/';
      window.location.assign(getPortalPathnameForRedirect(targetPath, locale));
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/popup-closed-by-user'
          ? t('auth.errors.popupClosed' as any)
          : firebaseError.code === 'auth/popup-blocked'
            ? t('auth.errors.popupBlocked' as any)
            : firebaseError.code === 'auth/cancelled-popup-request'
              ? t('auth.errors.popupCancelled' as any)
              : firebaseError.code === 'auth/account-exists-with-different-credential'
                ? t('auth.errors.account' as any)
                : firebaseError.message || t('auth.errors.generic' as any);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGoogle(false);
    }
  };

  const onSubmit = async (data: LoginData) => {
    set(true);
    setError(null);
    try {
      await loginWithEmail(data.email, data.password);
      toast.success(t('auth.login.success' as any));
      const targetPath = redirectPath?.includes('/invite/') ? '/dashboard/' : redirectPath || '/';
      window.location.assign(getPortalPathnameForRedirect(targetPath, locale));
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/user-not-found'
          ? t('auth.errors.userNot' as any)
          : firebaseError.code === 'auth/wrong-password' ||
              firebaseError.code === 'auth/invalid-credential'
            ? t('auth.errors.wrongPassword' as any)
            : firebaseError.code === 'auth/invalid-email'
              ? t('auth.errors.invalidEmail' as any)
              : firebaseError.code === 'auth/too-many-requests'
                ? t('auth.errors.too-many-requests' as any)
                : firebaseError.message || t('auth.errors.generic' as any);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      set(false);
    }
  };

  return (
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
            {t('auth.login.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{t('auth.login.subtitle')}</p>
        </div>
      </div>

      <Card className="p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input
              label={t('auth.login.email')}
              type="email"
              placeholder="yours@example.com"
              error={errors.email?.message}
              success={touchedFields.email && !errors.email}
              leftIcon={<Mail size={18} />}
              {...register('email')}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('auth.login.password')}
                </label>
                <Link
                  href={getPortalHref('/forgot-password/')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
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
                    showPassword ? t('auth.hidePassword' as any) : t('auth.showPassword' as any)
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-surface-200 dark:border-surface-800 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/40 transition-all cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-xs font-medium text-surface-500 dark:text-surface-400 cursor-pointer select-none"
              >
                {t('auth.login.rememberMe' as any)}
              </label>
            </div>
          </div>

          <FormError message={error} />

          <Button type="submit" loading={loading} className="w-full h-11">
            <span>{t('auth.login.signIn')}</span>
            <ArrowRight size={16} />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-surface-200 dark:border-surface-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-surface-900 px-2 text-surface-500">
                {t('auth.login.sso')}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 border-surface-200 dark:border-surface-800"
            type="button"
            onClick={handleGoogleSignIn}
            loading={google}
            disabled={loading || google}
          >
            <svg className="w-5 h-5 me-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t('auth.login.google')}</span>
          </Button>
        </form>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          {t('auth.login.noAccount')}{' '}
          <Link
            href={
              redirectPath
                ? `${getPortalPath('/signup/')}?redirect=${encodeURIComponent(redirectPath)}`
                : getPortalHref('/signup/')
            }
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            prefetch={false}
            onClick={e => {
              e.preventDefault();
              const path = redirectPath
                ? `/signup/?redirect=${encodeURIComponent(redirectPath)}`
                : '/signup/';
              navigateToPortal(path);
            }}
          >
            {t('auth.login.createOne')}
          </Link>
        </p>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-surface-400 text-xs mt-8">
        <ShieldCheck size={14} />
        <span>{t('auth.login.secure')}</span>
        <span className="mx-1">•</span>
        <span>&copy; {new Date().getFullYear()} CartShift Studio</span>
      </div>
    </div>
  );
}

export default function LoginClient() {
  const t = useTranslations('portal');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-500">{t('loading.auth.login')}</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
