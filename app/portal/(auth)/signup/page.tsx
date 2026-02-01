'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { signUpWithEmail } from '@/lib/services/auth';
import { useTranslations } from 'next-intl';
import { getPortalPath } from '@/lib/utils/portal-paths';

type SignupData = z.infer<ReturnType<typeof getSignupSchema>>;

const getSignupSchema = (t: (path: string) => string) =>
  z
    .object({
      name: z.string().min(2, t('portal.auth.errors.invalidName')),
      email: z.string().email(t('portal.auth.errors.invalidEmail')),
      password: z.string().min(6, t('portal.auth.errors.weakPassword')),
      confirmPassword: z.string().min(6, t('portal.auth.errors.weakPassword')),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('portal.auth.errors.mismatch'),
      path: ['confirmPassword'],
    });

function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, set] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const signupSchema = useMemo(() => getSignupSchema((path: string) => t(path as any)), [t]);

  const prefilledEmail = searchParams?.get('email') || null;
  const redirectPath = searchParams?.get('redirect') || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: prefilledEmail || '',
    },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue('email', prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const onSubmit = async (data: SignupData) => {
    set(true);
    setError(null);
    try {
      await signUpWithEmail(data.email, data.password, data.name);
      if (mounted && router) {
        router.push(redirectPath || getPortalPath('/'));
      } else {
        window.location.href = redirectPath || getPortalPath('/');
      }
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage =
        firebaseError.code === 'auth/email-already-in-use'
          ? t('portal.auth.errors.emailInUse' as any)
          : firebaseError.code === 'auth/invalid-email'
            ? t('portal.auth.errors.invalidEmail' as any)
            : firebaseError.code === 'auth/weak-password'
              ? t('portal.auth.errors.weakPassword' as any)
              : firebaseError.message || t('portal.auth.errors.genericSignup' as any);
      setError(errorMessage);
    } finally {
      set(false);
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
            {t('portal.auth.signup.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('portal.auth.signup.subtitle')}
          </p>
        </div>
      </div>

      <Card className="p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('portal.auth.signup.fullName')}
            placeholder={t('portal.common.namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label={t('portal.auth.signup.email')}
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={t('portal.auth.signup.password')}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label={t('portal.auth.signup.confirmPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full h-11">
            <span>{t('portal.auth.signup.createAccount')}</span>
            <ArrowRight size={16} />
          </Button>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
            {t('portal.auth.signup.alreadyHaveAccount')}{' '}
            <Link
              href={
                redirectPath
                  ? getPortalPath(`/login?redirect=${encodeURIComponent(redirectPath)}`)
                  : getPortalPath('/login/')
              }
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t('portal.auth.signup.signIn')}
            </Link>
          </p>
        </form>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-surface-400 text-xs mt-8">
        <ShieldCheck size={14} />
        <span>{t('portal.auth.signup.secure')}</span>
        <span className="mx-1">•</span>
        <span>&copy; {new Date().getFullYear()} CartShift Studio</span>
      </div>
    </div>
  );
}

function SignupFormWrapper() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <SignupForm />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-500">...</p>
          </div>
        </div>
      }
    >
      <SignupFormWrapper />
    </Suspense>
  );
}
