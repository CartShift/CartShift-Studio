'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { CV_PDF_FILENAME, getEnglishCVData } from '@/lib/cv/cv-data';

interface CVDownloadButtonProps {
  label: string;
  preparingLabel?: string;
}

export function CVDownloadButton({
  label,
  preparingLabel = 'Preparing PDF',
}: CVDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { resolvedTheme } = useTheme();
  const t = useTranslations('portal');
  const isDark = resolvedTheme !== 'light';

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const [{ pdf }, { CVDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./CVDocument'),
      ]);
      const blob = await pdf(<CVDocument cv={getEnglishCVData()} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = CV_PDF_FILENAME;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('toast.cvPdfReady'));
    } catch {
      toast.error(t('toast.cvPdfFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={isDark ? 'glass' : 'secondary'}
      disabled={isGenerating}
      onClick={handleDownload}
      leftIcon={
        isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )
      }
      className="min-h-[40px]"
    >
      {isGenerating ? preparingLabel : label}
    </Button>
  );
}
