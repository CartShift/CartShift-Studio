'use client';

import { HomeIcon, ArrowLeft, Compass } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface NotClientProps {
  isPortalRoute?: boolean;
}

export default function NotClient({ isPortalRoute = false }: NotClientProps) {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-surface-50 via-surface-50 to-surface-100 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900 relative overflow-hidden">
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 start-[10%] w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 rotate-12"
        animate={{ y: [0, -20, 0], rotate: [12, 18, 12] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-40 end-[15%] w-12 h-12 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5"
        animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-32 start-[20%] w-20 h-20 rounded-3xl bg-purple-500/10 dark:bg-purple-500/5 -rotate-6"
        animate={{ y: [0, 15, 0], rotate: [-6, -12, -6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-48 end-[10%] w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/5 rotate-45"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center space-y-8 relative z-10"
      >
        {/* 404 Display */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[10rem] md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-surface-200 via-surface-300 to-surface-200 dark:from-surface-800 dark:via-surface-700 dark:to-surface-800 select-none leading-none font-outfit"
          >
            404
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/30 flex items-center justify-center">
              <Compass className="w-12 h-12 text-white/90" />
            </div>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
            {t('not.title' as any)}
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed max-w-md mx-auto">
            {t('not.description' as any)}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
        >
          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-2xl font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-700 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:translate-x-1"
            />
            {t('not.goBack' as any)}
          </button>
          <Link
            href={isPortalRoute ? getPortalPath('/login/') : '/'}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            <HomeIcon size={18} className="group-hover:scale-110 transition-transform" />
            {isPortalRoute ? t('not.portalLogin' as any) : t('not.goHome' as any)}
          </Link>
        </motion.div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-sm text-surface-500 dark:text-surface-500 pt-6"
        >
          {t('not.needHelp' as any)}{' '}
          <Link
            href="/contact/"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-bold hover:underline underline-offset-2 transition-colors"
          >
            {t('not.contactTeam' as any)}
          </Link>
        </motion.p>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-3 pt-4"
        >
          <Link
            href="/work/"
            className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/50 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            Our Work
          </Link>
          <Link
            href="/services/"
            className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/50 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            Services
          </Link>
          <Link
            href="/blog/"
            className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/50 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            Blog
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
