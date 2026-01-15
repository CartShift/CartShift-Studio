'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Request, Organization } from '@/lib/types/portal';
import { Button } from '@/components/ui/Button';
import { FileText, Loader2 } from 'lucide-react';
import { InvoiceDocument } from './InvoiceDocument';
import { useTranslations } from 'next-intl';

// Loading component for dynamic import
const PDFLoadingButton = () => {
  const t = useTranslations();
  return (
    <Button variant="outline" disabled className="gap-2">
      <Loader2 size={16} className="animate-spin" />
      {t('portal.invoices.loadingPdf')}
    </Button>
  );
};

// Dynamically import PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <PDFLoadingButton />,
  }
);

interface InvoiceDownloadButtonProps {
  request: Request;
  organization: Organization;
  className?: string;
}

export const InvoiceDownloadButton: React.FC<InvoiceDownloadButtonProps> = ({
  request,
  organization,
  className,
}) => {
  const t = useTranslations();
  const invoiceId = `INV-${request.id.substring(0, 8).toUpperCase()}`;
  const fileName = `invoice-${invoiceId}.pdf`;

  return (
    <div className={className}>
      <PDFDownloadLink
        document={
          <InvoiceDocument request={request} organization={organization} invoiceId={invoiceId} />
        }
        fileName={fileName}
      >
        {({ loading }) => (
          <Button variant="outline" disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {loading
              ? t('portal.invoices.generatingInvoice')
              : t('portal.invoices.downloadInvoice')}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};
