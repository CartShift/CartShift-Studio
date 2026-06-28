'use client';

import { useTranslations } from 'next-intl';
import {
  PortalTable,
  PortalTableBody,
  PortalTableElement,
  PortalTableHead,
  PortalTableHeader,
  PortalTableRow,
  PortalTableScroll,
} from '@/components/portal/ui/PortalTable';
import { AgencyClient, ClientListRow } from './ClientListRow';

interface ClientListProps {
  clients: AgencyClient[];
  currentUserId?: string;
  onViewAsClient: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ClientList({ clients, currentUserId, onViewAsClient, onDelete }: ClientListProps) {
  const t = useTranslations('portal');

  return (
    <PortalTable>
      <PortalTableScroll>
        <PortalTableElement>
          <PortalTableHeader>
            <PortalTableRow>
              <PortalTableHead className="w-[40%]">
                {t('agency.clients.table.client')}
              </PortalTableHead>
              <PortalTableHead>{t('agency.clients.table.plan')}</PortalTableHead>
              <PortalTableHead>{t('sales.metrics.revenue')}</PortalTableHead>
              <PortalTableHead>{t('agency.clients.tickets')}</PortalTableHead>
              <PortalTableHead cellAlign="end">{t('common.actions')}</PortalTableHead>
            </PortalTableRow>
          </PortalTableHeader>
          <PortalTableBody>
            {clients.map(client => (
              <ClientListRow
                key={client.id}
                client={client}
                isMyClient={currentUserId === client.responsibleAgencyUserId}
                onViewAsClient={onViewAsClient}
                onDelete={onDelete}
              />
            ))}
          </PortalTableBody>
        </PortalTableElement>
      </PortalTableScroll>
    </PortalTable>
  );
}

export type { AgencyClient };
