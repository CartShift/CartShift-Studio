import { NextRequest, NextResponse } from 'next/server';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { checkRateLimit as checkFirestoreRateLimit } from '@/lib/services/rate-limiter';
import { AnalyzerService } from '@/lib/services/analyzer';
import { deliverStoreAnalysisReport } from '@/lib/services/analyzer-report-delivery';
import { serializeAnalysisForClient } from '@/lib/services/analyzer-response';
import { verifyRecaptchaToken } from '@/lib/services/recaptcha-server';
import { validateAnalyzeStoreRequest } from '@/lib/validation';
import { validateStoreUrlForAnalysis } from '@/lib/utils/store-url';

export const maxDuration = 120;

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

function getRateLimitKey(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  if (ip && ip !== 'unknown') {
    return `analyze-store:${ip}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `analyze-store:dev:${userAgent.slice(0, 120)}`;
}

function formatZodErrors(error: { issues: { message: string }[] }): string {
  return error.issues.map(issue => issue.message).join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    if (!rateLimitKey) {
      return NextResponse.json(
        createErrorResponse(
          'Could not verify your request origin. Please try again from a standard network connection.',
          400
        ),
        { status: 400 }
      );
    }

    const rateLimitResult = await checkFirestoreRateLimit(
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.resetAt
        ? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        : 60;
      return NextResponse.json(
        createErrorResponse(
          'Too many analysis requests. Please wait a minute before trying again.',
          429
        ),
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(createErrorResponse('Invalid JSON', 400), { status: 400 });
    }

    const validation = validateAnalyzeStoreRequest(body);
    if (!validation.success) {
      return NextResponse.json(createErrorResponse(formatZodErrors(validation.errors), 400), {
        status: 400,
      });
    }

    const { storeUrl, email, subscribeNewsletter, locale, captchaToken } = validation.data;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (recaptchaSecret) {
      if (!captchaToken) {
        return NextResponse.json(
          createErrorResponse('Security verification required. Please refresh the page.', 400),
          { status: 400 }
        );
      }

      const captchaValid = await verifyRecaptchaToken(captchaToken, recaptchaSecret);
      if (!captchaValid) {
        return NextResponse.json(
          createErrorResponse(
            'Security verification failed. Please refresh the page and try again.',
            400
          ),
          { status: 400 }
        );
      }
    }

    const urlValidation = await validateStoreUrlForAnalysis(storeUrl);
    if (!urlValidation.ok) {
      return NextResponse.json(createErrorResponse(urlValidation.error, 400), { status: 400 });
    }

    const normalizedUrl = urlValidation.normalizedUrl;

    let result;
    try {
      result = await AnalyzerService.analyzeStore(normalizedUrl);
    } catch (analysisError: unknown) {
      const errorMsg = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      let userFriendlyMsg = errorMsg;

      if (errorMsg.includes('Could not access')) {
        userFriendlyMsg = 'Could not access store URL. Please check if the store is online.';
      } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        userFriendlyMsg = 'Analysis timed out. The store may be slow or unresponsive.';
      } else if (errorMsg.includes('HTTP')) {
        userFriendlyMsg = `Store returned an error (${errorMsg}). Please verify the URL.`;
      }

      logError('AnalyzerService error', analysisError, { url: normalizedUrl });
      return NextResponse.json(createErrorResponse(userFriendlyMsg, 500), { status: 500 });
    }

    const emailReportStatus = await deliverStoreAnalysisReport({
      email,
      storeUrl: normalizedUrl,
      locale: locale || 'en',
      results: result,
      subscribeNewsletter: subscribeNewsletter ?? false,
    });

    const clientResult = serializeAnalysisForClient({
      ...result,
      meta: {
        ...result.meta,
        emailReportStatus,
      },
    });

    return NextResponse.json(clientResult, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
      },
    });
  } catch (error: unknown) {
    logError('Analysis route error', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(createErrorResponse(message, 500), { status: 500 });
  }
}
