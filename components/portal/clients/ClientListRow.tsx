'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import {
  PortalTableCell,
  PortalTableRow,
} from '@/components/portal/ui/PortalTable';
import { MoreVertical, ArrowUpRight, Eye, Trash2, ShieldCheck } from 'lucide-react';
import { Organization } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { formatCompactCurrency } from '@/lib/utils/format-compact-currency';

export interface AgencyClient extends Organization {
  totalRevenue?: number;
  requestCount?: number;
}

interface ClientListRowProps {
  client: AgencyClient;
  isMyClient: boolean;
  onViewAsClient: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ClientListRow({
  client,
  isMyClient,
  onViewAsClient,
  onDelete,
}: ClientListRowProps) {
  const t = useTranslations('portal');
  const router = useRouter();

  return (
    <PortalTableRow>
      <PortalTableCell className="w-[40%]">
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
                  ? t(`agency.clients.badge.${client.status}` as Parameters<typeof t>[0])
                  : 'Active'}
              </Badge>
              {isMyClient ? (
                <Badge
                  variant="blue"
                  className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5"
                >
                  {t('agency.clients.you')}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </PortalTableCell>

      <PortalTableCell>
        <div className="flex items-center gap-1.5">
          <ShieldCheck
            size={14}
            className={client.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'}
          />
          <span className="font-medium">
            {client.plan
              ? t(`agency.clients.plans.${client.plan}` as Parameters<typeof t>[0])
              : 'Basic'}
          </span>
        </div>
      </PortalTableCell>

      <PortalTableCell>
        <span className="font-mono font-medium">
          {formatCompactCurrency((client.totalRevenue ?? 0) / 100)}
        </span>
      </PortalTableCell>

      <PortalTableCell>
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs font-bold">
          {client.requestCount ?? 0}
        </span>
      </PortalTableCell>

      <PortalTableCell cellAlign="end">
        <Dropdown
          trigger={
            <IconButton
              icon={MoreVertical}
              label={t('common.actions')}
              variant="ghost"
              size="sm"
            />
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
              label: t('common.delete'),
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => onDelete(client.id, client.name),
            },
          ]}
        />
      </PortalTableCell>
    </PortalTableRow>
  );
}
