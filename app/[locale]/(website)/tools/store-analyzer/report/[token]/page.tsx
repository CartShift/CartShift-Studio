import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivateReportClient } from '@/components/analyzer/PrivateReportClient';
import { getPrivateAnalysisReport } from '@/lib/services/analysis-report-store';

export const metadata: Metadata = {
  title: 'Private Store Analysis Report',
  robots: { index: false, follow: false, nocache: true },
};

export default async function PrivateReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getPrivateAnalysisReport(token);
  if (!result) notFound();
  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-32 dark:bg-surface-950">
      <PrivateReportClient result={result} />
    </main>
  );
}
