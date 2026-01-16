import { Suspense } from 'react';
import OAuthCallbackClient from './OAuthCallbackClient';

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
          <div className="animate-pulse text-surface-500">...</div>
        </div>
      }
    >
      <OAuthCallbackClient />
    </Suspense>
  );
}
