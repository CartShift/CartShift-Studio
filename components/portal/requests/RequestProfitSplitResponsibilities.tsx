'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { resolveProfitSplitResponsibilitiesFromContext } from '@/lib/utils/profit-split-responsibilities';
import { useProfitSplitMutations } from '@/lib/hooks/useProfitSplits';
import {
  PROFIT_SPLIT_ROLE,
  RequestProfitSplitResponsibility,
} from '@/lib/types/profit-split';
import { Organization, PortalUser, Request } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';
import {
  normalizeRequestProfitSplitResponsibilities,
} from '@/lib/utils/profit-split-responsibilities';
import { roleOrder } from '@/lib/utils/profit-split-ui';

interface RequestProfitSplitResponsibilitiesProps {
  request: Request;
  organization?: Organization | null;
  agencyTeam: PortalUser[];
  canEdit: boolean;
}

function getResponsibleAgentName(
  agencyTeam: PortalUser[],
  organization?: Organization | null
): string {
  if (!organization?.responsibleAgencyUserId) return '';
  const member = agencyTeam.find(user => user.id === organization.responsibleAgencyUserId);
  return member?.name || member?.email || '';
}

export function RequestProfitSplitResponsibilities({
  request,
  organization,
  agencyTeam,
  canEdit,
}: RequestProfitSplitResponsibilitiesProps) {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { updateResponsibilities, isMutating } = useProfitSplitMutations();
  const responsibleAgentName = getResponsibleAgentName(agencyTeam, organization);

  const resolved = useMemo(
    () =>
      resolveProfitSplitResponsibilitiesFromContext(
        request,
        organization,
        responsibleAgentName
      ),
    [organization, request, responsibleAgentName]
  );

  const [items, setItems] = useState<RequestProfitSplitResponsibility[]>(resolved);

  useEffect(() => {
    setItems(resolved);
  }, [resolved]);

  const totalPercentage = useMemo(
    () => Number(items.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)),
    [items]
  );

  const handleSave = async () => {
    try {
      await updateResponsibilities.mutateAsync({
        requestId: request.id,
        responsibilities: normalizeRequestProfitSplitResponsibilities(items),
      });
    } catch {
      // Toast handled in hook.
    }
  };

  if (!request.isBillable && !request.publicToken) return null;

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
      <div className="mb-4">
        <CardSectionTitle as="h4">
          {t('requests.detail.profitSplitResponsibilities.title')}
        </CardSectionTitle>
        <p className="mt-1 text-xs text-surface-500">
          {t('requests.detail.profitSplitResponsibilities.hint')}
        </p>
      </div>

      <div className="space-y-3">
        {roleOrder.map(role => {
          const item = items.find(entry => entry.role === role);
          if (!item) return null;

          return (
            <div key={role} className="grid gap-2 md:grid-cols-[120px_1fr_88px] md:items-center">
              <span className="text-xs font-bold uppercase tracking-wide text-surface-500">
                {t(`profitSplits.roles.${role}`)}
              </span>

              {role === PROFIT_SPLIT_ROLE.LEAD ? (
                <div className="text-sm">
                  <p className="font-bold text-surface-900 dark:text-white">
                    {item.userName || t('profitSplits.unassigned')}
                  </p>
                  {organization?.id && (
                    <Link
                      href={getPortalPath(`/agency/clients/${organization.id}`, locale)}
                      className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {t('requests.detail.profitSplitResponsibilities.editOnClient')}
                    </Link>
                  )}
                </div>
              ) : role === PROFIT_SPLIT_ROLE.DELIVERY ? (
                <div className="text-sm">
                  <p className="font-bold text-surface-900 dark:text-white">
                    {item.userName || t('requests.detail.unassigned')}
                  </p>
                  <p className="text-xs text-surface-500">
                    {t('requests.detail.profitSplitResponsibilities.deliveryFromSpecialist')}
                  </p>
                </div>
              ) : (
                <Select
                  value={item.userId}
                  onChange={event => {
                    const member = agencyTeam.find(user => user.id === event.target.value);
                    setItems(prev =>
                      prev.map(entry =>
                        entry.role === role
                          ? {
                              ...entry,
                              userId: member?.id ?? '',
                              userName: member?.name || member?.email || '',
                            }
                          : entry
                      )
                    );
                  }}
                  disabled={!canEdit || isMutating}
                  placeholder={t('profitSplits.unassigned')}
                  options={agencyTeam.map(member => ({
                    value: member.id,
                    label: member.name || member.email,
                  }))}
                  className="h-9 text-xs font-bold"
                />
              )}

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={item.percentage}
                  onChange={event =>
                    setItems(prev =>
                      prev.map(entry =>
                        entry.role === role
                          ? { ...entry, percentage: Number(event.target.value) || 0 }
                          : entry
                      )
                    )
                  }
                  disabled={!canEdit || isMutating}
                  className="h-9 w-full rounded-lg border border-surface-200 bg-white px-2 text-xs font-bold text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white"
                  aria-label={t('profitSplits.percentage')}
                />
                <span className="text-xs font-bold text-surface-400">%</span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPercentage !== 100 && (
        <p className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400">
          {t('requests.detail.profitSplitResponsibilities.allocationWarning', {
            total: totalPercentage,
          })}
        </p>
      )}

      {canEdit && (
        <Button
          type="button"
          className="mt-4"
          size="sm"
          onClick={handleSave}
          loading={updateResponsibilities.isPending}
          disabled={isMutating}
        >
          <Save size={16} />
          {t('requests.detail.profitSplitResponsibilities.save')}
        </Button>
      )}
    </Card>
  );
}
