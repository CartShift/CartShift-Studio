'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { InviteClientForm } from '@/components/portal/forms/InviteClientForm';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/ui/ModalBackdrop';
import type { MarketingLead } from '@/lib/services/portal-marketing';

interface LeadInviteModalProps {
  lead: MarketingLead;
  organizations: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export function LeadInviteModal({ lead, organizations, onClose }: LeadInviteModalProps) {
  const t = useTranslations('portal.marketing');
  const [orgId, setOrgId] = useState(organizations[0]?.id || '');

  if (!orgId) {
    return (
      <ModalBackdrop isOpen onClick={onClose} variant="default" blur="sm" zIndex="200">
        <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
          <ModalHeader title={t('actions.inviteTitle')} onClose={onClose} />
          <ModalBody>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              {t('actions.inviteNoOrg')}
            </p>
          </ModalBody>
        </ModalContent>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop isOpen onClick={onClose} variant="default" blur="sm" zIndex="200">
      <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('actions.inviteTitle')} onClose={onClose} />
        <ModalBody>
          {organizations.length > 1 && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-surface-500">
                {t('actions.selectOrg')}
              </label>
              <select
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-surface-950"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <InviteClientForm
            orgId={orgId}
            preSelectedEmail={lead.email}
            onSuccess={() => onClose()}
            onCancel={onClose}
          />
        </ModalBody>
      </ModalContent>
    </ModalBackdrop>
  );
}
