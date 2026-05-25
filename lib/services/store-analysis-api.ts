import type { AnalysisResult } from '@/lib/types/analyzer';

export type StoreAnalysisInput = {
  storeUrl: string;
  email: string;
  subscribeNewsletter: boolean;
  captchaToken: string;
  locale: string;
};

export async function submitStoreAnalysis(input: StoreAnalysisInput): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorData.error || 'Analysis failed');
  }

  return response.json() as Promise<AnalysisResult>;
}
