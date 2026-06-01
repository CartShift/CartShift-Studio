'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { AlertCircle, ArrowLeft, Loader2, FileText, ExternalLink, LockKeyhole, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRequest } from '@/lib/services/portal-requests';
import {
  PRICING_STATUS,
  PRICING_STATUS_CONFIG,
  formatCurrency,
} from '@/lib/types/pricing';
import { Request } from '@/lib/types/portal';
import { useLocale, useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useResolvedPricingId } from '@/lib/hooks/useResolvedPricingId';
import { usePricingRequest } from '@/lib/hooks/usePricingRequest';
import { ProposalPaymentPanel } from '@/components/portal/pricing/ProposalPaymentPanel';
import {
  getPricingStatusBadgeVariant,
  getStatusBadgeVariant,
  getClientStatusBadgeVariant,
} from '@/lib/utils/portal-helpers';
import { CLIENT_STATUS_MAP } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';

// mapStatusColor moved to lib/utils/portal-helpers.ts

export default function PricingDetailClient() {
  const orgId = useResolvedOrgId();
  const pricingId = useResolvedPricingId();
  const t = useTranslations('portal');
  const locale = useLocale();
  const { isAgency } = usePortalAuth();
  const pricingQuery = usePricingRequest(typeof pricingId === 'string' ? pricingId : null);

  const [linkedRequests, setLinkedRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pricingRequest = pricingQuery.data ?? null;

  useEffect(() => {
    if (!orgId || !pricingId || typeof orgId !== 'string' || typeof pricingId !== 'string') {
      setError(t('common.error' as never));
      return undefined;
    }
    if (pricingQuery.error) {
      setError(t('common.error' as never));
      return undefined;
    }
    if (!pricingRequest) return undefined;

    const fetchLinkedRequests = async () => {
      try {
        // Fetch linked requests if any
        if (pricingRequest.requestIds && pricingRequest.requestIds.length > 0) {
          const requestPromises = pricingRequest.requestIds.map(id => getRequest(id));
          const requests = await Promise.all(requestPromises);
          setLinkedRequests(requests.filter((r): r is Request => r !== null));
        } else {
          setLinkedRequests([]);
        }
      } catch (err) {
        console.error('Failed to fetch pricing request:', err);
        setError(t('common.error' as never));
      }
    };

    fetchLinkedRequests();
    return undefined;
  }, [orgId, pricingId, pricingQuery.error, pricingRequest, t]);

  if (pricingQuery.isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-surface-400 font-outfit">
          {t('common.loading' as any)}
        </p>
      </div>
    );
  }

  if (error || !pricingRequest) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          {t('common.error' as any)}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm">{error}</p>
        <Link href={getPortalPath('/pricing/')}>
          <Button>{t('common.back' as any)}</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = PRICING_STATUS_CONFIG[pricingRequest.status];
  const statusColor = getPricingStatusBadgeVariant(statusConfig.color);

  return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <Link href={getPortalPath('/pricing/')}>
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              {t('common.back' as any)}
            </Button>
          </Link>
          {isAgency &&
            (pricingRequest.status === PRICING_STATUS.DRAFT ||
              pricingRequest.status === PRICING_STATUS.SENT) && (
              <Link href={getPortalPath(`/pricing/${pricingId}/edit`)}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Pencil size={18} />
                  {t('common.edit' as any)}
                </Button>
              </Link>
            )}
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit mb-2">
                {pricingRequest.title}
              </h1>
              {pricingRequest.description && (
                <p className="text-surface-600 dark:text-surface-400">
                  {pricingRequest.description}
                </p>
              )}
            </div>
            <Badge variant={statusColor}>
              {t(`pricing.status.${pricingRequest.status.toLowerCase()}` as never)}
            </Badge>
            {(pricingRequest.status === PRICING_STATUS.ACCEPTED ||
              pricingRequest.status === PRICING_STATUS.PAID) && (
              <Badge variant="gray" className="ms-2">
                <LockKeyhole size={13} />
                {t('pricing.detail.locked')}
              </Badge>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">
                  {t('pricing.form.total' as any)}
                </p>
                <p className="text-2xl font-black text-surface-900 dark:text-white font-outfit">
                  {formatCurrency(pricingRequest.totalAmount, pricingRequest.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">
                  {t('common.status' as any)}
                </p>
                <Badge variant={statusColor}>
                  {t(`pricing.status.${pricingRequest.status.toLowerCase()}` as never)}
                </Badge>
              </div>
            </div>
          </div>

          {pricingRequest.lineItems && pricingRequest.lineItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
                {t('pricing.form.lineItems' as never)}
              </h3>
              <div className="space-y-2">
                {pricingRequest.lineItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-white">
                        {item.description}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-end ms-4">
                      <p className="font-bold text-surface-900 dark:text-white">
                        {formatCurrency(item.unitPrice * item.quantity, pricingRequest.currency)}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {item.quantity} × {formatCurrency(item.unitPrice, pricingRequest.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pricingRequest.terms && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-3">
                {t('pricing.detail.terms')}
              </h3>
              <p className="whitespace-pre-line rounded-xl bg-surface-50 p-4 text-sm leading-6 text-surface-600 dark:bg-surface-900 dark:text-surface-300">
                {pricingRequest.terms}
              </p>
            </div>
          )}

          {(pricingRequest.timeframe || pricingRequest.workDeadline || pricingRequest.assignedToName) && (
            <div className="mb-6 rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
              <h3 className="font-outfit text-lg font-bold text-surface-900 dark:text-white">
                {t('pricing.detail.deliveryPlan')}
              </h3>
              <div className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-300">
                {pricingRequest.assignedToName && (
                  <p>
                    <strong>{t('pricing.detail.assignedDeveloper')}:</strong>{' '}
                    {pricingRequest.assignedToName}
                  </p>
                )}
                {pricingRequest.timeframe && (
                  <p>
                    <strong>{t('pricing.detail.timeframe')}:</strong> {pricingRequest.timeframe}
                  </p>
                )}
                {pricingRequest.workDeadline && (
                  <p>
                    <strong>{t('pricing.detail.workDeadline')}:</strong>{' '}
                    {pricingRequest.workDeadline.toDate().toLocaleDateString(locale)}
                  </p>
                )}
              </div>
            </div>
          )}

          {pricingRequest.signatureText && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                {t('pricing.detail.signatureEvidence')}
              </p>
              <p className="mt-2 font-outfit text-xl font-black text-emerald-900 dark:text-emerald-100">
                {pricingRequest.signatureText}
              </p>
              {pricingRequest.acceptedByEmail && (
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  {pricingRequest.acceptedByEmail}
                </p>
              )}
            </div>
          )}

          {/* Linked Requests Section */}
          {linkedRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
                <FileText className="inline w-5 h-5 me-2" />
                {t('pricing.includedRequests')}
              </h3>
              <div className="space-y-2">
                {linkedRequests.map(request => {
                  return (
                    <Link
                      key={request.id}
                      href={getPortalPath(`/requests/${request.id}`)}
                      className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-surface-900 dark:text-white truncate">
                            {request.title}
                          </h4>
                          <Badge variant="gray" className="text-xs">
                            {request.type
                              ? t(`requests.type.${request.type.toLowerCase()}` as any)
                              : t('requests.type.design')}
                          </Badge>
                          <Badge
                            variant={
                              isAgency
                                ? getStatusBadgeVariant(request.status)
                                : getClientStatusBadgeVariant(request.status)
                            }
                            className="text-xs"
                          >
                            {isAgency
                              ? t(`requests.status.${request.status.toLowerCase()}` as any)
                              : t(
                                  `requests.clientStatus.${CLIENT_STATUS_MAP[request.status].toLowerCase()}` as any
                                )}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-1">
                            {request.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity ms-2" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {!isAgency &&
            pricingRequest.paymentRequired &&
            pricingRequest.paymentStatus !== 'paid' &&
            pricingRequest.publicToken && (
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
              <a href={`/${locale}/proposal/${pricingRequest.publicToken}`}>
                <Button className="w-full">{t('pricing.detail.continuePayment')}</Button>
              </a>
            </div>
          )}
        </Card>
        {isAgency && <ProposalPaymentPanel proposal={pricingRequest} locale={locale} />}
      </div>
  );
}
