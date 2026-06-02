'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleOAuthCallback } from '@/lib/services/portal-google-calendar';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Button } from '@/components/ui/Button';

const CALLBACK_RESULT_KEY = 'google_oauth_callback_result';

type CachedCallbackResult = {
  state: string;
  success: boolean;
  error?: string;
};

function readCachedResult(state: string): CachedCallbackResult | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(CALLBACK_RESULT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedCallbackResult;
    return parsed.state === state ? parsed : null;
  } catch {
    sessionStorage.removeItem(CALLBACK_RESULT_KEY);
    return null;
  }
}

function cacheResult(result: CachedCallbackResult) {
  sessionStorage.setItem(CALLBACK_RESULT_KEY, JSON.stringify(result));
}

export default function OAuthCallbackClient() {
  const t = useTranslations('portal.googleCalendar');
  const tCallback = useTranslations('portal.googleCalendar.oauthCallback');
  const tCommon = useTranslations('portal.common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleRedirect = () => {
      redirectTimer = setTimeout(() => {
        router.push(getPortalPath('/agency/settings?tab=integrations'));
      }, 2000);
    };

    async function processCallback() {
      if (oauthError) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            oauthError === 'access_denied'
              ? tCallback('accessDenied')
              : tCallback('oauthError', { error: oauthError })
          );
        }
        return;
      }

      if (!code || !state) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(tCommon('missingOAuthParams'));
        }
        return;
      }

      const cached = readCachedResult(state);
      if (cached) {
        if (cancelled) return;

        if (cached.success) {
          setStatus('success');
          scheduleRedirect();
        } else {
          setStatus('error');
          setErrorMessage(cached.error || tCommon('unknownError'));
        }
        return;
      }

      const result = await handleOAuthCallback(code, state);
      cacheResult({
        state,
        success: result.success,
        error: result.error,
      });

      if (cancelled) return;

      if (result.success) {
        setStatus('success');
        scheduleRedirect();
      } else {
        setStatus('error');
        setErrorMessage(result.error || tCommon('unknownError'));
      }
    }

    void processCallback();

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [code, state, oauthError, router, tCallback, tCommon]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{t('title')}</h1>
            <p className="text-surface-500 dark:text-surface-400">{tCallback('processingDescription')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              {tCallback('connectedTitle')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400">{tCallback('redirectingDescription')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              {tCallback('failedTitle')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mb-4">{errorMessage}</p>
            <Button onClick={() => router.push(getPortalPath('/agency/settings'))}>
              {tCommon('backToSettings')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
