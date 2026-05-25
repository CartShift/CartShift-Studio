import { useMutation } from '@tanstack/react-query';
import {
  submitStoreAnalysis,
  type StoreAnalysisInput,
} from '@/lib/services/store-analysis-api';

export function useStoreAnalysisMutation() {
  const mutation = useMutation({
    mutationFn: (input: StoreAnalysisInput) => submitStoreAnalysis(input),
  });

  return {
    analyzeStore: mutation.mutate,
    analyzeStoreAsync: mutation.mutateAsync,
    isAnalyzing: mutation.isPending,
    resetAnalysis: mutation.reset,
    analysisError: mutation.error,
  };
}
