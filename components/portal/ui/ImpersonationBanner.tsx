'use client';

import { useImpersonation } from '@/lib/context/ImpersonationContext';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '@/lib/services/portal-organizations';
import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedAccountId, exitImpersonation } = useImpersonation();
  const t = useTranslations('portal');

  const { data: org } = useQuery({
    queryKey: ['organization', impersonatedAccountId],
    queryFn: () => (impersonatedAccountId ? getOrganization(impersonatedAccountId) : null),
    enabled: !!impersonatedAccountId,
    staleTime: Infinity,
  });

  if (!isImpersonating) return null;

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-banner-fixed">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye size={16} className="animate-pulse" />
        <span>
          {t('impersonation.viewingAs')}{' '}
          <span className="font-bold underline cursor-help" title={impersonatedAccountId || ''}>
            {org?.name || t('impersonation.client')}
          </span>
        </span>
      </div>
      <button
        onClick={exitImpersonation}
        className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors font-medium border border-white/20"
      >
        <span>{t('impersonation.exitView')}</span>
        <X size={14} />
      </button>
    </div>
  );
}
