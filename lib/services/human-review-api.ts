import type { HumanReviewRequestData } from '@/lib/validation';

export async function submitHumanReview(input: HumanReviewRequestData) {
  const response = await fetch('/api/human-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not request a human review');
  return result as { success: true; requestId: string };
}
