import { NextRequest, NextResponse } from 'next/server';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { checkRateLimit as checkFirestoreRateLimit } from '@/lib/services/rate-limiter';
import { AnalyzerService } from '@/lib/services/analyzer';

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  if (ip) {
    return `analyze-store:${ip}`;
  }
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `analyze-store:ua:${userAgent}`;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    // Rate Limiting
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

    // Body Parsing
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(createErrorResponse('Invalid JSON', 400), { status: 400 });
    }

    const { storeUrl, email, subscribeNewsletter, locale, captchaToken } = body;

    // Verify Captcha
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json(
          createErrorResponse('Security verification required. Please refresh the page.', 400),
          { status: 400 }
        );
      }

      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
      const captchaRes = await fetch(verifyUrl, { method: 'POST' });
      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        return NextResponse.json(
          createErrorResponse(
            'Security verification failed. Please refresh the page and try again.',
            400
          ),
          { status: 400 }
        );
      }
    }

    if (!storeUrl || !email) {
      return NextResponse.json(
        createErrorResponse('Store URL and email address are required.', 400),
        { status: 400 }
      );
    }

    // URL Normalization & Validation
    let normalizedUrl = storeUrl.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // SSRF Checks
    try {
      const urlObj = new URL(normalizedUrl);
      const hostname = urlObj.hostname.toLowerCase();

      if (
        ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return NextResponse.json(
          createErrorResponse(
            'Invalid store URL. Localhost and internal URLs are not allowed.',
            400
          ),
          { status: 400 }
        );
      }

      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        return NextResponse.json(
          createErrorResponse('Invalid URL protocol. Only HTTP and HTTPS are supported.', 400),
          { status: 400 }
        );
      }
    } catch (_e) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid URL format. Please enter a valid store URL (e.g., https://example.com).',
          400
        ),
        { status: 400 }
      );
    }

    // Call Service
    let result;
    try {
      result = await AnalyzerService.analyzeStore(normalizedUrl);
    } catch (analysisError: any) {
      // Provide more specific error messages
      const errorMsg = analysisError.message || 'Analysis failed';
      let userFriendlyMsg = errorMsg;

      if (errorMsg.includes('Could not access')) {
        userFriendlyMsg = 'Could not access store URL. Please check if the store is online.';
      } else if (errorMsg.includes('timeout')) {
        userFriendlyMsg = 'Analysis timed out. The store may be slow or unresponsive.';
      } else if (errorMsg.includes('HTTP')) {
        userFriendlyMsg = `Store returned an error (${errorMsg}). Please verify the URL.`;
      }

      logError('AnalyzerService error', analysisError, { url: normalizedUrl });
      return NextResponse.json(createErrorResponse(userFriendlyMsg, 500), { status: 500 });
    }

    // Trigger Email (Background)
    const firebaseFunctionUrl =
      process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL?.replace(
        'contactForm',
        'sendStoreAnalysisReport'
      ) || 'https://us-central1-cartshiftstudio.cloudfunctions.net/sendStoreAnalysisReport';

    // We don't await this to keep response fast, but catch errors
    fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        storeUrl: normalizedUrl,
        locale: locale || 'en',
        results: result,
        subscribeNewsletter,
      }),
    }).catch(err => console.error('Email trigger failed', err));

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
      },
    });
  } catch (error: any) {
    logError('Analysis route error', error);
    return NextResponse.json(createErrorResponse(error.message || 'Analysis failed', 500), {
      status: 500,
    });
  }
}
