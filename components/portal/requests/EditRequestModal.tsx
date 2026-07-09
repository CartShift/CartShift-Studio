'use client';

import { ModalBackdrop, ModalContent } from '@/components/ui/ModalBackdrop';
import { RequestForm } from '@/components/portal/forms/RequestForm';
import { Request } from '@/lib/types/portal';
import { X } from 'lucide-react';
import { usePortalTranslations } from '@/lib/i18n/translations';

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  orgId: string;
}

export function EditRequestModal({ isOpen, onClose, request, orgId }: EditRequestModalProps) {
  const t = usePortalTranslations();

  if (!isOpen) return null;

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose} zIndex="50">
      <ModalContent maxWidth="2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-800 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-800 shrink-0">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
              {t('common.edit')} {t('requests.title_singular')}
            </h2>
            <button
              onClick={onClose}
              className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center  p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto portal-scrollbar">
            <RequestForm
              orgId={orgId}
              mode="edit"
              requestId={request.id}
              initialValues={{
                title: request.title,
                description: request.description,
                type: request.type,
                priority: request.priority,
              }}
              onSuccess={onClose}
              onCancel={onClose}
            />
          </div>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
