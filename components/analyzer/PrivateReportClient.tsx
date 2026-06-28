'use client';
import { useRouter } from '@/i18n/navigation';
import { AnalysisResults } from '@/components/sections/AnalysisResults';
import type { AnalysisResult } from '@/lib/types/analyzer';

export function PrivateReportClient({ result }: { result: AnalysisResult }) {
  const router = useRouter();
  return <AnalysisResults results={result} onReset={() => router.push('/tools/store-analyzer')} />;
}
