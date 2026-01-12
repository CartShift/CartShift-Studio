'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalInput } from '@/components/portal/ui/PortalInput';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { loginWithEmail, signInWithGoogle } from '@/lib/services/auth';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

type LoginData = z.infer<ReturnType<typeof getLoginSchema>>;

const getLoginSchema = (t: (path: string) => string) =>
  z.object({
    email: z.string().email(t('portal.auth.errors.invalidEmail' as any)),
    password: z.string().min(6, t('portal.auth.errors.weakPassword' as any)),
  });

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const redirectPath = searchParams?.get('redirect') || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      toast.success(t('portal.auth.login.success' as any));
      router.push(redirectPath || '/portal/');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/popup-closed-by-user'
          ? t('portal.auth.errors.popupClosed' as any)
          : firebaseError.code === 'auth/popup-blocked'
            ? t('portal.auth.errors.popupBlocked' as any)
            : firebaseError.code === 'auth/cancelled-popup-request'
              ? t('portal.auth.errors.popupCancelled' as any)
              : firebaseError.code === 'auth/account-exists-with-different-credential'
                ? t('portal.auth.errors.accountExists' as any)
                : firebaseError.message || t('portal.auth.errors.generic' as any);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginSchema = useMemo(() => {
    if (!mounted) return z.object({ email: z.string().email(), password: z.string().min(6) });
    return getLoginSchema((path: string) => t(path as any));
  }, [t, mounted]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(data.email, data.password);
      toast.success(t('portal.auth.login.success' as any));
      router.push(redirectPath || '/portal/');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/user-not-found'
          ? t('portal.auth.errors.userNotFound' as any)
          : firebaseError.code === 'auth/wrong-password' ||
              firebaseError.code === 'auth/invalid-credential'
            ? t('portal.auth.errors.wrongPassword' as any)
            : firebaseError.code === 'auth/invalid-email'
              ? t('portal.auth.errors.invalidEmail' as any)
              : firebaseError.code === 'auth/too-many-requests'
                ? t('portal.auth.errors.too-many-requests' as any)
                : firebaseError.message || t('portal.auth.errors.generic' as any);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
          C
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
            {t('portal.auth.login.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('portal.auth.login.subtitle')}
          </p>
        </div>
      </div>

      <PortalCard className="p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <PortalInput
              label={t('portal.auth.login.email')}
              type="email"
              placeholder="yours@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('portal.auth.login.password')}
                </label>
                <Link
                  href="/portal/forgot-password/"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('portal.auth.login.forgotPassword')}
                </Link>
              </div>
              <PortalInput
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <PortalButton type="submit" isLoading={loading} className="w-full h-11">
            <span>{t('portal.auth.login.signIn')}</span>
            <ArrowRight size={16} />
          </PortalButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-surface-200 dark:border-surface-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-surface-900 px-2 text-surface-500">
                {t('portal.auth.login.sso')}
              </span>
            </div>
          </div>

          <PortalButton
            variant="outline"
            className="w-full h-11 border-surface-200 dark:border-surface-800"
            type="button"
            onClick={handleGoogleSignIn}
            isLoading={googleLoading}
            disabled={loading || googleLoading}
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
            <span>{t('portal.auth.login.google')}</span>
          </PortalButton>
        </form>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          {t('portal.auth.login.noAccount')}{' '}
          <Link
            href={
              redirectPath
                ? `/portal/signup?redirect=${encodeURIComponent(redirectPath)}`
                : '/portal/signup'
            }
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('portal.auth.login.createOne')}
          </Link>
        </p>
      </PortalCard>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-surface-400 text-xs mt-8">
        <ShieldCheck size={14} />
        <span>{t('portal.auth.login.secure')}</span>
        <span className="mx-1">•</span>
        <span>&copy; {new Date().getFullYear()} CartShift Studio</span>
      </div>
    </div>
  );
}

function LoginFormWrapper() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-500">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginFormWrapper />
    </Suspense>
  );
}
