'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ModalBackdrop, ModalContent } from '@/components/ui/ModalBackdrop';
import { useRequestPreview } from '@/lib/context/RequestPreviewContext';
import { cn } from '@/lib/utils';

const RequestDetailClient = dynamic(
  () =>
    import(
      '@/app/[locale]/portal/(workspace)/requests/[requestId]/RequestDetailClient'
    ).then(module => module.default),
  { ssr: false }
);

export function RequestPreviewModal() {
  const t = useTranslations('portal');
  const { previewRequestId, closeRequestPreview, expandRequestPreview } = useRequestPreview();

  if (!previewRequestId) return null;

  return (
    <ModalBackdrop
      isOpen
      onClick={closeRequestPreview}
      zIndex={70}
      variant="surface"
      blur="md"
    >
      <ModalContent
        maxWidth="full"
        accessibleTitle={t('requests.preview.title' as any)}
        onClick={event => event.stopPropagation()}
        className={cn(
          'w-[min(100vw-1rem,72rem)] max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden p-0',
          'max-sm:fixed max-sm:inset-x-2 max-sm:bottom-2 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-2xl'
        )}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <RequestDetailClient
            requestIdOverride={previewRequestId}
            variant="preview"
            onClosePreview={closeRequestPreview}
            onExpandPreview={expandRequestPreview}
          />
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
