import type { RequestStatus } from '@/lib/types/portal';

/** Read-only request fields needed for an agency client dashboard summary. */
interface RequestForSummary {
  status: RequestStatus;
  createdAt?: unknown;
  closedAt?: unknown;
  deliveredAt?: unknown;
}

const FINISHED = new Set<RequestStatus>(['DELIVERED', 'PAID', 'CLOSED']);
const TERMINAL = new Set<RequestStatus>([
  ...FINISHED, 'CANCELED', 'DECLINED', 'EXPIRED',
]);

function timestampMillis(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.toMillis === 'function') {
      const millis = (record.toMillis as () => number)();
      return Number.isFinite(millis) ? millis : null;
    }
    if (typeof record.toDate === 'function') {
      return timestampMillis((record.toDate as () => Date)());
    }
    const seconds = record.seconds ?? record._seconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const nanoseconds = record.nanoseconds ?? record._nanoseconds;
      return seconds * 1000 + (typeof nanoseconds === 'number' ? nanoseconds / 1_000_000 : 0);
    }
  }
  return null;
}

/** Pure projection, reusable by the client detail page and reporting. */
export function summarizeClientRequests(requests: readonly RequestForSummary[]) {
  let activeRequests = 0;
  let completedRequests = 0;
  let resolutionDaysTotal = 0;
  let resolvedWithValidDates = 0;

  for (const request of requests) {
    if (!TERMINAL.has(request.status)) activeRequests++;
    if (!FINISHED.has(request.status)) continue;
    completedRequests++;

    const startedAt = timestampMillis(request.createdAt);
    const finishedAt = timestampMillis(request.closedAt ?? request.deliveredAt);
    if (startedAt === null || finishedAt === null || finishedAt < startedAt) continue;

    resolutionDaysTotal += (finishedAt - startedAt) / 86_400_000;
    resolvedWithValidDates++;
  }

  return {
    activeRequests,
    completedRequests,
    avgResolution: resolvedWithValidDates > 0
      ? Math.round(resolutionDaysTotal / resolvedWithValidDates)
      : 0,
  };
}
