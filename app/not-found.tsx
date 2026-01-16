'use client';

import { HomeIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Not() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="text-9xl font-bold text-surface-200 dark:text-surface-800 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center transform -rotate-12">
              <span className="text-white text-4xl">?</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Page Not</h1>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-xl font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <HomeIcon size={18} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
