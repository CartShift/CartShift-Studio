import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import DevLoginClient from './DevLoginClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dev Login | CartShift Portal',
  robots: { index: false, follow: false },
};

export default async function DevLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0d12]" />}>
      <DevLoginClient />
    </Suspense>
  );
}
