'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { useLocale } from 'next-intl';
import { getAuthInstance, syncSessionCookie } from '@/lib/services/auth';
import { getPortalPathnameForRedirect } from '@/lib/utils/portal-paths';

type DevLoginState = 'checking' | 'signing-in' | 'success' | 'blocked' | 'error';

function isLocalhostBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
}

export default function DevLoginClient() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const secret = searchParams.get('secret') ?? '';
  const redirectPath = searchParams.get('redirect') ?? '/dashboard/';

  const [state, setState] = useState<DevLoginState>('checking');
  const [message, setMessage] = useState('Preparing localhost dev login…');

  const targetPath = useMemo(() => {
    const normalized = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }, [redirectPath]);

  useEffect(() => {
    if (!isLocalhostBrowser()) {
      setState('blocked');
      setMessage('Dev login is only available on localhost.');
      return;
    }

    if (!secret) {
      setState('error');
      setMessage('Missing ?secret= query parameter.');
      return;
    }

    let cancelled = false;

    async function signIn() {
      setState('signing-in');
      setMessage('Signing in with dev credentials…');

      try {
        const response = await fetch('/api/dev/portal-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret }),
        });

        if (response.status === 404) {
          throw new Error('Dev auth is disabled. Set PORTAL_DEV_AUTH_ENABLED=true in .env.local.');
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || `Dev auth failed (${response.status})`);
        }

        const auth = getAuthInstance();
        const credential = await signInWithCustomToken(auth, payload.customToken);
        await syncSessionCookie(credential.user);

        if (cancelled) return;

        setState('success');
        setMessage(`Signed in as ${payload.email ?? 'dev user'}. Redirecting…`);
        window.location.assign(getPortalPathnameForRedirect(targetPath, locale));
      } catch (error) {
        if (cancelled) return;
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Dev login failed.');
      }
    }

    void signIn();

    return () => {
      cancelled = true;
    };
  }, [locale, secret, targetPath]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0d12] px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Localhost Dev Login</p>
        <h1 className="mt-3 text-2xl font-semibold">Portal agent access</h1>
        <p className="mt-4 text-sm text-white/70">{message}</p>
        {state === 'error' || state === 'blocked' ? (
          <p className="mt-6 text-xs text-white/45">
            Use `/en/portal/dev-login/?secret=YOUR_SECRET&redirect=/dashboard/` on localhost only.
          </p>
        ) : null}
      </section>
    </main>
  );
}
