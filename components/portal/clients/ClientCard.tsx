'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  MoreVertical,
  ArrowUpRight,
  Eye,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Ticket,
} from 'lucide-react';
import { Organization } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface AgencyClient extends Organization {
  totalRevenue?: number;
  requestCount?: number;
}

interface ClientCardProps {
  client: AgencyClient;
  isMyClient: boolean;
  onViewAsClient: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ClientCard({ client, isMyClient, onViewAsClient, onDelete }: ClientCardProps) {
  const t = useTranslations('portal');
  const router = useRouter();

  const formatRev = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card
      key={client.id}
      noPadding
      className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-900 transition-all group h-full flex flex-col"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={client.logoUrl}
              name={client.name}
              size="lg"
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
            />
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white leading-tight line-clamp-1 text-base">
                {client.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    client.status === 'inactive'
                      ? 'gray'
                      : client.status === 'suspended'
                        ? 'red'
                        : 'green'
                  }
                  className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5"
                >
                  {client.status
                    ? t(`agency.clients.badge.${client.status}` as any)
                    : t('agency.clients.badge.active')}
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

          <Dropdown
            trigger={
              <button className="text-surface-400 hover:text-surface-900 dark:hover:text-white p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <MoreVertical size={16} />
              </button>
            }
            align="right"
            items={[
              {
                label: t('agency.clients.detail.overview'),
                icon: <ArrowUpRight size={14} />,
                onClick: () => router.push(getPortalPath(`/agency/clients/${client.id}/`)),
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
        </div>

        {/* Plan & Stats */}
        <div className="mt-auto space-y-4">
          {/* Plan Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
            <ShieldCheck
              size={12}
              className={client.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'}
            />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {client.plan ? t(`agency.clients.plans.${client.plan}` as any) : 'Basic'}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-surface-400 font-bold mb-0.5">
                {t('sales.metrics.revenue')}
              </span>
              <div className="flex items-center gap-1.5 text-surface-900 dark:text-white font-bold">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>{formatRev(client.totalRevenue || 0)}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-surface-400 font-bold mb-0.5">
                {t('agency.clients.tickets')}
              </span>
              <div className="flex items-center gap-1.5 text-surface-900 dark:text-white font-bold">
                <Ticket size={14} className="text-primary-500" />
                <span>{client.requestCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-5 py-3 bg-surface-50/50 dark:bg-surface-900/50 border-t border-surface-100 dark:border-surface-800 rounded-b-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors">
        <Link
          href={getPortalPath(`/agency/clients/${client.id}/`)}
          className="flex items-center justify-between text-surface-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          {t('agency.clients.manageClient')}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
