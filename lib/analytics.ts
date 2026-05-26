import { sendGAEvent } from '@next/third-parties/google';

type EventParams = Record<string, string | number | boolean | undefined>;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const IS_DEV = process.env.NODE_ENV === 'development';

const debugLog = (eventName: string, params?: EventParams) => {
  if (IS_DEV) console.log(`[GA] ${eventName}`, params ?? '');
};

export const trackEvent = (eventName: string, params?: EventParams) => {
  debugLog(eventName, params);
  if (!GA_ID) return;
  sendGAEvent('event', eventName, params ?? {});
};

// Form tracking
export const trackFormSubmit = (formName: string, formLocation: string) => {
  trackEvent('form_submit', { form_name: formName, form_location: formLocation });
};

export const trackHeroFormSubmit = () => {
  trackEvent('hero_form_submit', { form_location: 'hero' });
};

export const trackContactFormSubmit = () => {
  trackEvent('contact_form_submit', { form_location: 'contact' });
};

// Contact actions
export const trackBookCallClick = (buttonLocation: string) => {
  trackEvent('book_call_click', { button_location: buttonLocation });
};

export const trackWhatsAppClick = () => trackEvent('whatsapp_click');
export const trackPhoneClick = () => trackEvent('phone_click');
export const trackEmailClick = () => trackEvent('email_click');

// Content engagement
export const trackPortfolioView = (projectName: string) => {
  trackEvent('portfolio_view', { project_name: projectName });
};

export const trackCaseStudyScroll = (projectName: string, scrollDepth: number) => {
  trackEvent('case_study_scroll', { project_name: projectName, scroll_depth: scrollDepth });
};

export const trackPricingView = () => trackEvent('pricing_view');

// Store Analyzer tracking
export const trackAnalyzerStarted = (storeUrl: string) => {
  trackEvent('store_analysis_started', { store_url: storeUrl });
};

export const trackAnalyzerCompleted = (params: {
  storeUrl: string;
  overallScore: number;
  platform: string;
  duration: number;
  hasPuppeteer: boolean;
  hasVisualAnalysis: boolean;
  hasProductAnalysis: boolean;
}) => {
  trackEvent('store_analysis_completed', {
    store_url: params.storeUrl,
    overall_score: params.overallScore,
    platform: params.platform,
    duration_ms: params.duration,
    has_puppeteer: params.hasPuppeteer,
    has_visual_analysis: params.hasVisualAnalysis,
    has_product_analysis: params.hasProductAnalysis,
  });
};

export const trackAnalyzerFailed = (params: {
  storeUrl: string;
  errorMessage: string;
  errorType: 'network' | 'timeout' | 'validation' | 'server' | 'unknown';
  duration?: number;
}) => {
  trackEvent('store_analysis_failed', {
    store_url: params.storeUrl,
    error_message: params.errorMessage,
    error_type: params.errorType,
    duration_ms: params.duration,
  });
};

export const trackAnalyzerServiceFailure = (params: {
  serviceName: 'puppeteer' | 'pagespeed' | 'competitor' | 'ai' | 'cache' | 'benchmark';
  errorMessage: string;
  gracefulDegradation: boolean;
}) => {
  trackEvent('analyzer_service_failure', {
    service_name: params.serviceName,
    error_message: params.errorMessage,
    graceful_degradation: params.gracefulDegradation,
  });
};

export const trackAnalyzerFeatureUnavailable = (featureName: string, reason: string) => {
  trackEvent('analyzer_feature_unavailable', {
    feature_name: featureName,
    reason: reason,
  });
};

export const trackPackageClick = (packageName: string) => {
  trackEvent('package_click', { package_name: packageName });
};

export const trackBlogRead = (postTitle: string, postCategory?: string) => {
  trackEvent('blog_read', { post_title: postTitle, post_category: postCategory });
};

export const trackCTAClick = (ctaText: string, ctaLocation: string) => {
  trackEvent('cta_click', { cta_text: ctaText, cta_location: ctaLocation });
};

export const trackLanguageSwitch = (newLanguage: string) => {
  trackEvent('language_switch', { new_language: newLanguage });
};

export const trackNewsletterSignup = (location: string) => {
  trackEvent('newsletter_signup', { signup_location: location });
};

export const trackFunnelStage = (stage: string, source?: string) => {
  trackEvent('funnel_stage', { funnel_stage: stage, funnel_source: source });
};

export const trackAnalyzerQuoteClick = (params: {
  storeUrl: string;
  overallScore: number;
  fixCount: number;
}) => {
  trackEvent('analyzer_results_quote', {
    store_url: params.storeUrl,
    overall_score: params.overallScore,
    fix_count: params.fixCount,
  });
};

export const trackExitIntentShown = () => trackEvent('exit_intent_shown');

export const trackExitIntentClosed = (action: 'cta_clicked' | 'dismissed') => {
  trackEvent('exit_intent_closed', { action });
};

// Outbound link tracking
export const trackOutboundLink = (url: string, linkText?: string) => {
  trackEvent('outbound_link', { url, link_text: linkText });
};

// Error tracking
export const trackError = (errorMessage: string, errorSource?: string) => {
  trackEvent('js_error', { error_message: errorMessage, error_source: errorSource });
};

// Portal tracking
export const trackPortalEvent = (eventName: string, params?: EventParams) => {
  trackEvent(`portal_${eventName}`, { ...params, area: 'portal' });
};

export const trackPortalLogin = (method: string) => trackPortalEvent('login', { method });
export const trackPortalSignup = () => trackPortalEvent('signup');
export const trackPortalRequestCreate = (type: string) =>
  trackPortalEvent('request_create', { request_type: type });

export const trackPortalRequestStatusChange = (requestId: string, from: string, to: string) => {
  trackPortalEvent('status_change', { request_id: requestId, from_status: from, to_status: to });
};

export const trackPortalComment = (requestId: string) =>
  trackPortalEvent('comment_add', { request_id: requestId });
export const trackPortalFileUpload = (fileType: string) =>
  trackPortalEvent('file_upload', { file_type: fileType });
export const trackPortalInviteSent = () => trackPortalEvent('invite_sent');
