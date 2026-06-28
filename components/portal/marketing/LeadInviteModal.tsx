'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { InviteClientForm } from '@/components/portal/forms/InviteClientForm';
import { Select } from '@/components/ui/Select';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
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
              <PortalFormField label={t('actions.selectOrg')}>
                <Select
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  options={organizations.map(org => ({
                    value: org.id,
                    label: org.name,
                  }))}
                />
              </PortalFormField>
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
