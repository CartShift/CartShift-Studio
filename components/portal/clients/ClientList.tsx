'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { MoreVertical, ArrowUpRight, Eye, Trash2, ShieldCheck } from 'lucide-react';
import { Organization } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface AgencyClient extends Organization {
  totalRevenue?: number;
  requestCount?: number;
}

interface ClientListProps {
  clients: AgencyClient[];
  currentUserId?: string;
  onViewAsClient: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ClientList({ clients, currentUserId, onViewAsClient, onDelete }: ClientListProps) {
  const t = useTranslations('portal');
  const router = useRouter();

  const formatRev = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800">
            <tr>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-surface-400 w-[40%] text-start">
                {t('agency.clients.table.client')}
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-surface-400 text-start">
                {t('agency.clients.table.plan')}
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-surface-400 text-start">
                {t('sales.metrics.revenue')}
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-surface-400 text-start">
                {t('agency.clients.tickets')}
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-surface-400 text-end">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {clients.map(client => {
              const isMyClient = currentUserId === client.responsibleAgencyUserId;
              return (
                <tr key={client.id} className="group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={client.logoUrl}
                        name={client.name}
                        size="md"
                        className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                      />
                      <div>
                        <Link
                          href={getPortalPath(`/agency/clients/${client.id}/`)}
                          className="font-bold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block leading-tight"
                        >
                          {client.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={client.status === 'inactive' ? 'gray' : 'green'}
                            className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5"
                          >
                            {client.status
                              ? t(`agency.clients.badge.${client.status}` as any)
                              : 'Active'}
                          </Badge>
                          {isMyClient && (
                            <Badge
                              variant="blue"
                              className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5"
                            >
                              {t('agency.clients.you')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        size={14}
                        className={
                          client.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'
                        }
                      />
                      <span className="font-medium text-surface-700 dark:text-surface-300">
                        {client.plan ? t(`agency.clients.plans.${client.plan}` as any) : 'Basic'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-surface-700 dark:text-surface-300">
                      {formatRev(client.totalRevenue || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs font-bold">
                      {client.requestCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <Dropdown
                      trigger={
                        <button className="text-surface-400 hover:text-surface-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      }
                      align="right"
                      items={[
                        {
                          label: t('agency.clients.detail.overview'),
                          icon: <ArrowUpRight size={14} />,
                          onClick: () =>
                            router.push(getPortalPath(`/agency/clients/${client.id}/`)),
                        },
                        {
                          label: t('agency.clients.viewAsClient'),
                          icon: <Eye size={14} />,
                          onClick: () => onViewAsClient(client.id),
                        },
                        {
                          label: t('common.delete') || 'Delete',
                          icon: <Trash2 size={14} />,
                          variant: 'danger',
                          onClick: () => onDelete(client.id, client.name),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
