'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
import {
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/ModalBackdrop';

interface RequestRevisionModalProps {
  isOpen: boolean;
  notes: string;
  isSubmitting: boolean;
  onNotesChange: (notes: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RequestRevisionModal({
  isOpen,
  notes,
  isSubmitting,
  onNotesChange,
  onClose,
  onSubmit,
}: RequestRevisionModalProps) {
  const t = useTranslations('portal');

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose}>
      <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
        <ModalHeader
          title={t('requests.detail.requestRevision')}
          description={t('requests.detail.revisionDesc')}
          onClose={onClose}
        />
        <ModalBody>
          <PortalFormField label={t('requests.detail.revisionPlaceholder')}>
            <Textarea
              placeholder={t('requests.detail.revisionPlaceholder')}
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </PortalFormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting} className="flex-1">
            {t('requests.detail.submitRevision')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalBackdrop>
  );
}
