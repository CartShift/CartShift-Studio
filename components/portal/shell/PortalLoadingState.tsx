'use client';

import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

export function PortalState() {
  return (
    <>
      {/* Container that matches side-by-side layout of shell */}
      {/* Sidebar Skeleton - Matches PortalSidebar.tsx */}
      <div className="hidden md:flex md:w-[var(--sidebar-width-expanded)] flex-col border-e border-surface-200/50 dark:border-surface-800/30 bg-white dark:bg-surface-950/80 shrink-0 shadow-2xl shadow-surface-950/20 z-[70]">
        {/* Brand - Matches SidebarBrand.tsx */}
        <div className="h-20 flex items-center px-4 border-b border-surface-200/50 dark:border-surface-800/30 shrink-0 gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>

        {/* Org Switcher - Matches OrganizationSwitcher.tsx */}
        <div className="px-3 py-2 border-b border-surface-200/50 dark:border-surface-800/30 shrink-0">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Nav Items - Matches SidebarNavigation.tsx */}
        <div className="flex-1 p-3 space-y-0.5 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-xl opacity-60" />
          ))}
        </div>

        {/* Footer - Matches SidebarFooter.tsx */}
        <div className="p-3 border-t border-surface-200/50 dark:border-surface-800/30 mt-auto space-y-2 shrink-0">
          <div className="hidden md:flex">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-20 ms-3" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-50 dark:bg-surface-950">
        {/* Header - Matches PortalHeader.tsx */}
        <header className="h-16 md:h-20 px-4 md:px-6 border-b border-surface-200/50 dark:border-surface-800/30 bg-white/50 dark:bg-surface-950/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          {/* Left: Mobile Toggle & Search */}
          <div className="flex items-center gap-3 md:gap-6">
            <Skeleton className="md:hidden h-10 w-10 rounded-xl" /> {/* Mobile Menu */}
            <Skeleton className="hidden lg:block h-10 w-72 xl:w-96 rounded-xl" />{' '}
            {/* Global Search */}
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
            <div className="hidden sm:flex gap-2">
              <Skeleton className="h-9 w-20 rounded-2xl" /> {/* Language/Theme */}
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" /> {/* Notifications */}
            {/* Profile Section */}
            <div className="flex items-center gap-3 border-s border-surface-200 dark:border-surface-800 ps-3 md:ps-6">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
              <SkeletonAvatar size="sm" />
            </div>
          </div>
        </header>

        {/* Content - Matches PortalShell main area */}
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {/* Breadcrumbs */}
          <Skeleton className="h-4 w-48 mb-6" />

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
