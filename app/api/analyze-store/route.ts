import { after, NextRequest, NextResponse } from 'next/server';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { enforceApiRateLimit, rateLimitHeaders } from '@/lib/utils/api-rate-limit';
import { AnalyzerService } from '@/lib/services/analyzer';
import {
  deliverStoreAnalysisReport,
  resolveInitialEmailReportStatus,
} from '@/lib/services/analyzer-report-delivery';
import { serializeAnalysisForClient } from '@/lib/services/analyzer-response';
import { captureStoreAnalysisLead } from '@/lib/services/store-analysis-leads';
import { verifyRecaptchaToken } from '@/lib/services/recaptcha-server';
import { validateAnalyzeStoreRequest } from '@/lib/validation';
import { validateStoreUrlForAnalysis } from '@/lib/utils/store-url';
import { determinePrimaryIssue } from '@/lib/analyzer/funnel';
import { storePrivateAnalysisReport } from '@/lib/services/analysis-report-store';

export const maxDuration = 120;

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

function formatZodErrors(error: { issues: { message: string }[] }): string {
  return error.issues.map(issue => issue.message).join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforceApiRateLimit(request, 'analyze-store', {
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
      allowUserAgentFallback: process.env.NODE_ENV !== 'production',
      tooManyRequestsMessage:
        'Too many analysis requests. Please wait a minute before trying again.',
    });

    if ('response' in rateLimit) {
      return rateLimit.response;
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

    const { storeUrl, email, subscribeNewsletter, locale, captchaToken, intent, attribution } =
      validation.data;
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

    const issueDecision = determinePrimaryIssue(result);
    const reportCompletedAt = new Date().toISOString();
    result.meta = {
      ...result.meta,
      primaryIssue: issueDecision.primaryIssue,
      primaryIssueReasons: issueDecision.reasons,
      analyzerIntent: intent,
      reportCompletedAt,
    };

    const leadCaptureStatus = await captureStoreAnalysisLead({
      email,
      storeUrl: normalizedUrl,
      locale: locale || 'en',
      platform: result.platform,
      overallScore: result.overallScore,
      ...(() => {
        const [focusArea, focusSection] = Object.entries(result.sections).sort(
          ([, a], [, b]) => a.score - b.score
        )[0];
        const primaryRecommendation = focusSection.recommendations
          .filter(recommendation => !recommendation.excludeFromActionPlan)
          .sort((a, b) => {
            const priority = { high: 0, medium: 1, low: 2 } as const;
            return priority[a.impact] - priority[b.impact];
          })[0];

        return {
          focusArea: focusArea as
            | 'performance'
            | 'seo'
            | 'accessibility'
            | 'bestPractices'
            | 'cart'
            | 'trust',
          focusScore: focusSection.score,
          primaryRecommendation: primaryRecommendation?.title,
        };
      })(),
      subscribeNewsletter: subscribeNewsletter ?? false,
      intent,
      attribution,
      primaryIssue: issueDecision.primaryIssue,
      analyzerSubmittedAt: attribution?.lastTouch.capturedAt || reportCompletedAt,
      reportCompletedAt,
    });

    const emailReportStatus = resolveInitialEmailReportStatus();
    const skipLeadCapture = leadCaptureStatus === 'captured' || leadCaptureStatus === 'deduped';
    let clientResult = serializeAnalysisForClient({
      ...result,
      meta: { ...result.meta, emailReportStatus, leadCaptureStatus },
    });
    let reportUrl: string | undefined;
    try {
      const reportToken = await storePrivateAnalysisReport(clientResult, locale || 'en');
      if (reportToken) {
        const reportPath = `/${locale || 'en'}/tools/store-analyzer/report/${reportToken}`;
        reportUrl = new URL(reportPath, request.nextUrl.origin).toString();
        clientResult = { ...clientResult, meta: { ...clientResult.meta, reportPath } };
        result.meta.reportPath = reportPath;
      }
    } catch (reportStorageError) {
      logError('Private analysis report storage failed', reportStorageError, {
        storeUrl: normalizedUrl,
      });
    }
    const reportPayload = {
      email,
      storeUrl: normalizedUrl,
      locale: locale || 'en',
      results: result,
      subscribeNewsletter: subscribeNewsletter ?? false,
      skipLeadCapture,
      intent,
      attribution,
      primaryIssue: issueDecision.primaryIssue,
      reportUrl,
    };

    if (emailReportStatus === 'pending') {
      after(async () => {
        const deliveryStatus = await deliverStoreAnalysisReport(reportPayload);
        if (deliveryStatus === 'failed') {
          logError(
            'Store analysis report delivery failed after response',
            new Error('Background PDF delivery failed'),
            { storeUrl: normalizedUrl, email }
          );
        }
      });
    }

    return NextResponse.json(clientResult, {
      headers: rateLimitHeaders(RATE_LIMIT_MAX_REQUESTS, rateLimit.result.remaining),
    });
  } catch (error: unknown) {
    logError('Analysis route error', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(createErrorResponse(message, 500), { status: 500 });
  }
}
