'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleOAuthCallback } from '@/lib/services/portal-google-calendar';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function OAuthCallbackClient() {
  const t = useTranslations('portal');
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function processCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(
          error === 'access_denied'
            ? 'You denied access to Google Calendar'
            : `OAuth error: ${error}`
        );
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage(t('common.missingOAuthParams'));
        return;
      }

      const result = await handleOAuthCallback(code, state);

      if (result.success) {
        setStatus('success');
        // Redirect back to settings integrations tab after a short delay
        setTimeout(() => {
          router.push(getPortalPath('/agency/settings?tab=integrations'));
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || t('common.unknownError'));
      }
    }

    processCallback();
  }, [searchParams, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Google Calendar
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              Please wait while we complete the connection...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Connected !</h1>
            <p className="text-surface-500 dark:text-surface-400">
              Redirecting you back to settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Connection Failed
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push(getPortalPath('/agency/settings'))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to s
            </button>
          </>
        )}
      </div>
    </div>
  );
}
