'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Portal Auth Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Authentication Error</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md">
          {error.message || 'An unexpected error occurred during authentication.'}
        </p>
      </div>
      <Button onClick={reset} variant="primary" size="sm">
        Try Again
      </Button>
    </div>
  );
}
