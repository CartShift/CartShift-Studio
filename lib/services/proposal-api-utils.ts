import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-handler';
import { checkServerRateLimit } from '@/lib/services/server-rate-limiter';

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function enforceProposalRateLimit(
  request: NextRequest,
  scope: string,
  token: string,
  maxRequests = 10
): Promise<NextResponse | null> {
  const result = await checkServerRateLimit(
    `${scope}:${token}:${getClientIp(request)}`,
    maxRequests,
    60_000
  );
  if (result.allowed) return null;

  return NextResponse.json(createErrorResponse('Too many requests. Please try again later.', 429), {
    status: 429,
    headers: { 'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString() },
  });
}

export function mapProposalError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Proposal request failed';
  const status =
    message === 'NOT_FOUND'
      ? 404
      : message === 'UNAUTHENTICATED'
        ? 401
        : message === 'FORBIDDEN'
          ? 403
          : ['NOT_SIGNABLE', 'NOT_ACCEPTED', 'NOT_PAYABLE', 'EXPIRED', 'INVALID_SIGNATURE', 'INVALID_AMOUNT', 'INVALID_LABEL'].includes(
                message
              )
            ? 400
            : message === 'ADMIN_NOT_CONFIGURED' ||
                message === 'Firebase Admin is not configured' ||
                message === 'PayPal server credentials are not configured'
              ? 503
              : 500;
  return NextResponse.json(createErrorResponse(message.replaceAll('_', ' ').toLowerCase(), status), {
    status,
  });
}
