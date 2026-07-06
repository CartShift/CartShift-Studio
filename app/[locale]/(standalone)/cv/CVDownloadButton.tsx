'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { CV_PDF_FILENAME, getEnglishCVData } from '@/lib/cv/cv-data';
import { resolveCvPdfAssets } from '@/lib/cv/cv-media';

interface CVDownloadButtonProps {
  label: string;
  preparingLabel?: string;
  compact?: boolean;
}

export function CVDownloadButton({
  label,
  preparingLabel = 'Preparing PDF',
  compact = false,
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
      const resolvedAssets = await resolveCvPdfAssets();
      const blob = await pdf(
        <CVDocument cv={getEnglishCVData()} resolvedAssets={resolvedAssets} />
      ).toBlob();
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

  const icon = isGenerating ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  ) : (
    <Download className="h-4 w-4" aria-hidden="true" />
  );

  return (
    <Button
      size={compact ? 'icon' : 'sm'}
      variant={isDark ? 'glass' : 'secondary'}
      disabled={isGenerating}
      onClick={handleDownload}
      aria-label={label}
      leftIcon={compact ? undefined : icon}
      className={compact ? 'h-10 w-10 shrink-0 sm:h-8 sm:w-auto sm:px-3' : 'min-h-[40px]'}
    >
      {compact ? icon : null}
      <span className={compact ? 'hidden sm:inline' : undefined}>
        {isGenerating ? preparingLabel : label}
      </span>
    </Button>
  );
}
