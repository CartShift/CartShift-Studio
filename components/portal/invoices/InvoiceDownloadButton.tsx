'use client';
import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { BillingDocumentType, BillingProfile, Organization, PaymentRecord, Request } from '@/lib/types/portal';

export function InvoiceDownloadButton({ request, organization, billingProfile, payments = [], documentType, label, className }: {
  request: Request; organization: Organization; billingProfile?: BillingProfile | null; payments?: PaymentRecord[]; documentType: BillingDocumentType; label?: string; className?: string;
}) {
  const t = useTranslations('portal.invoices'); const locale = useLocale(); const [loading, setLoading] = useState(false);
  const id = `REQ-${request.id.slice(0, 8).toUpperCase()}`;
  const download = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { InvoiceDocument }] = await Promise.all([import('@react-pdf/renderer'), import('./InvoiceDocument')]);
      const blob = await pdf(<InvoiceDocument request={request} organization={organization} billingProfile={billingProfile} payments={payments} documentType={documentType} invoiceId={id} locale={locale} />).toBlob();
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${documentType}-${id}.pdf`; link.click(); URL.revokeObjectURL(url);
      toast.success(t('downloaded'));
    } catch { toast.error(t('failed')); } finally { setLoading(false); }
  };
  return <Button variant="outline" className={className} disabled={loading} onClick={download}>{loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}{label ?? t(`download.${documentType}`)}</Button>;
}
