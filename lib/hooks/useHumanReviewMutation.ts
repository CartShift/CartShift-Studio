'use client';

import { useMutation } from '@tanstack/react-query';
import { submitHumanReview } from '@/lib/services/human-review-api';

export function useHumanReviewMutation() {
  return useMutation({ mutationFn: submitHumanReview });
}
