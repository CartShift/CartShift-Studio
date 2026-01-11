import { sendGAEvent } from "@next/third-parties/google";

type EventParams = Record<string, string | number | boolean | undefined>;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const IS_DEV = process.env.NODE_ENV === "development";

const debugLog = (eventName: string, params?: EventParams) => {
  if (IS_DEV) console.log(`[GA] ${eventName}`, params ?? "");
};

export const trackEvent = (eventName: string, params?: EventParams) => {
  debugLog(eventName, params);
  if (!GA_ID) return;
  sendGAEvent("event", eventName, params ?? {});
};

// Form tracking
export const trackFormSubmit = (formName: string, formLocation: string) => {
  trackEvent("form_submit", { form_name: formName, form_location: formLocation });
};

export const trackHeroFormSubmit = () => {
  trackEvent("hero_form_submit", { form_location: "hero" });
};

export const trackContactFormSubmit = () => {
  trackEvent("contact_form_submit", { form_location: "contact" });
};

// Contact actions
export const trackBookCallClick = (buttonLocation: string) => {
  trackEvent("book_call_click", { button_location: buttonLocation });
};

export const trackWhatsAppClick = () => trackEvent("whatsapp_click");
export const trackPhoneClick = () => trackEvent("phone_click");
export const trackEmailClick = () => trackEvent("email_click");

// Content engagement
export const trackPortfolioView = (projectName: string) => {
  trackEvent("portfolio_view", { project_name: projectName });
};

export const trackCaseStudyScroll = (projectName: string, scrollDepth: number) => {
  trackEvent("case_study_scroll", { project_name: projectName, scroll_depth: scrollDepth });
};

export const trackPricingView = () => trackEvent("pricing_view");

export const trackPackageClick = (packageName: string) => {
  trackEvent("package_click", { package_name: packageName });
};

export const trackBlogRead = (postTitle: string, postCategory?: string) => {
  trackEvent("blog_read", { post_title: postTitle, post_category: postCategory });
};

export const trackCTAClick = (ctaText: string, ctaLocation: string) => {
  trackEvent("cta_click", { cta_text: ctaText, cta_location: ctaLocation });
};

export const trackLanguageSwitch = (newLanguage: string) => {
  trackEvent("language_switch", { new_language: newLanguage });
};

export const trackNewsletterSignup = (location: string) => {
  trackEvent("newsletter_signup", { signup_location: location });
};

export const trackExitIntentShown = () => trackEvent("exit_intent_shown");

export const trackExitIntentClosed = (action: "cta_clicked" | "dismissed") => {
  trackEvent("exit_intent_closed", { action });
};

// Outbound link tracking
export const trackOutboundLink = (url: string, linkText?: string) => {
  trackEvent("outbound_link", { url, link_text: linkText });
};

// Error tracking
export const trackError = (errorMessage: string, errorSource?: string) => {
  trackEvent("js_error", { error_message: errorMessage, error_source: errorSource });
};

// Portal tracking
export const trackPortalEvent = (eventName: string, params?: EventParams) => {
  trackEvent(`portal_${eventName}`, { ...params, area: "portal" });
};

export const trackPortalLogin = (method: string) => trackPortalEvent("login", { method });
export const trackPortalSignup = () => trackPortalEvent("signup");
export const trackPortalRequestCreate = (type: string) => trackPortalEvent("request_create", { request_type: type });

export const trackPortalRequestStatusChange = (requestId: string, from: string, to: string) => {
  trackPortalEvent("status_change", { request_id: requestId, from_status: from, to_status: to });
};

export const trackPortalCommentAdded = (requestId: string) => trackPortalEvent("comment_add", { request_id: requestId });
export const trackPortalFileUpload = (fileType: string) => trackPortalEvent("file_upload", { file_type: fileType });
export const trackPortalInviteSent = () => trackPortalEvent("invite_sent");
