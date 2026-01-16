'use client';

import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

export function PortalState() {
  return (
    <>
      {/* Container that matches side-by-side layout of shell */}
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-[280px] flex-col border-e border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 gap-6 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Org Switcher */}
        <Skeleton className="h-12 w-full rounded-xl" />

        {/* Nav Items */}
        <div className="space-y-1 flex-1">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-surface-100 dark:border-surface-800">
          <SkeletonAvatar size="sm" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-8 flex items-center justify-between sticky top-0 z-10">
          <Skeleton className="h-8 w-48" /> {/* Breadcrumbs */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" /> {/* Notifications */}
            <Skeleton className="h-9 w-9 rounded-full" /> {/* Mobile Menu / Profile */}
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>

          {/* Recent Activity / List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
