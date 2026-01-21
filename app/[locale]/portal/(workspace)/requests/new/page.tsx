import { setRequestLocale } from 'next-intl/server';

export default async function NewRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  // Need orgId, we can get it from client side or assume page will wait for client side hydration logic?
  // Actually, NewRequestPage is a Server Component. It renders `NewRequestClient`.
  // Wait, I should not replace *this* file's NewRequestClient import if I haven't updated NewRequestClient or substituted it.
  // The 'NewRequestClient' likely wraps logic to get orgId.
  // Let's check NewRequestClient.tsx first.
  return <NewRequestClientWrapper />;
}

import NewRequestClient from './NewRequestClient';
function NewRequestClientWrapper() {
  return <NewRequestClient />;
}
// Actually, reverting this thought. I'll rely on NewRequestClient to use RequestForm.
// I will View NewRequestClient.tsx primarily first.
